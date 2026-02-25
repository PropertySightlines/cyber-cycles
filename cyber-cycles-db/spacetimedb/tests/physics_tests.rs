//! Comprehensive physics tests for Cyber Cycles
//!
//! This test suite covers:
//! - Rubber banding system (20 tests)
//! - Collision detection (25 tests)
//! - Configuration validation (10 tests)
//! - Server-side validation (10+ tests)

use cyber_cycles_db::physics::{
    self, PhysicsConfig, CollisionConfig, RubberConfig, RubberState, PhysicsError,
    collision::{self, Segment, PlayerState, CollisionResult, CollisionType},
    rubber::{
        update_rubber, apply_malus, calculate_effectiveness, validate_rubber_usage,
        calculate_speed_modifier, get_effective_rubber, reset_rubber,
        increase_rubber_for_position, RUBBER_CONFIG,
    },
    config::FullPhysicsConfig,
};

const EPS: f32 = 0.01;

// ============================================================================
// RUBBER SYSTEM TESTS (20 tests)
// ============================================================================

mod test_rubber_system {
    use super::*;

    #[test]
    fn test_rubber_state_default_values() {
        let state = RubberState::default();
        assert_eq!(state.player_id, "");
        assert_eq!(state.rubber, RUBBER_CONFIG.base_rubber);
        assert_eq!(state.malus, 0.0);
        assert_eq!(state.malus_timer, 0.0);
    }

    #[test]
    fn test_rubber_state_new_with_id() {
        let state = RubberState::new("player1");
        assert_eq!(state.player_id, "player1");
        assert_eq!(state.rubber, RUBBER_CONFIG.base_rubber);
    }

    #[test]
    fn test_rubber_state_with_custom_rubber() {
        let state = RubberState::with_rubber("p1", 2.5);
        assert_eq!(state.rubber, 2.5);
    }

    #[test]
    fn test_rubber_state_clamps_to_min() {
        let state = RubberState::with_rubber("p1", 0.0);
        assert_eq!(state.rubber, RUBBER_CONFIG.min_rubber);
    }

    #[test]
    fn test_rubber_state_clamps_to_max() {
        let state = RubberState::with_rubber("p1", 10.0);
        assert_eq!(state.rubber, RUBBER_CONFIG.max_rubber);
    }

    #[test]
    fn test_update_rubber_exponential_decay() {
        let mut state = RubberState::new("p1");
        state.rubber = 3.0;
        
        let initial = state.rubber;
        update_rubber(&mut state, 1.0, None);
        
        assert!(state.rubber < initial);
        assert!(state.rubber > RUBBER_CONFIG.min_rubber);
    }

    #[test]
    fn test_update_rubber_multiple_steps() {
        let mut state = RubberState::new("p1");
        state.rubber = 4.0;
        
        for _ in 0..10 {
            update_rubber(&mut state, 0.1, None);
        }
        
        assert!(state.rubber < 4.0);
        assert!(state.rubber >= RUBBER_CONFIG.min_rubber);
    }

    #[test]
    fn test_update_rubber_with_custom_config() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        let fast_decay = RubberConfig {
            decay_rate: 0.5,
            ..RubberConfig::default()
        };
        
        update_rubber(&mut state, 1.0, Some(&fast_decay));
        assert!((state.rubber - 1.0).abs() < EPS);
    }

    #[test]
    fn test_update_rubber_malus_timer_decrement() {
        let mut state = RubberState::new("p1");
        state.malus_timer = 1.0;
        state.malus = 0.5;
        
        update_rubber(&mut state, 0.3, None);
        
        assert!((state.malus_timer - 0.7).abs() < EPS);
        assert_eq!(state.malus, 0.5);
    }

    #[test]
    fn test_update_rubber_malus_expires() {
        let mut state = RubberState::new("p1");
        state.malus_timer = 0.2;
        state.malus = 0.5;
        
        update_rubber(&mut state, 0.3, None);
        
        assert_eq!(state.malus_timer, 0.0);
        assert_eq!(state.malus, 0.0);
    }

    #[test]
    fn test_apply_malus_basic() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        let malus = apply_malus(&mut state, 1.0, 0.5);
        
        assert!(malus > 0.0);
        assert_eq!(state.malus, malus);
        assert!(state.malus_timer > 0.0);
    }

    #[test]
    fn test_apply_malus_factor_clamped_high() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        apply_malus(&mut state, 1.0, 2.0);
        let malus_high = state.malus;
        
        state.malus = 0.0;
        apply_malus(&mut state, 1.0, 1.0);
        let malus_max = state.malus;
        
        assert_eq!(malus_high, malus_max);
    }

    #[test]
    fn test_apply_malus_factor_zero() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        apply_malus(&mut state, 1.0, 0.0);
        
        assert_eq!(state.malus, 0.0);
    }

    #[test]
    fn test_apply_malus_duration_minimum() {
        let mut state = RubberState::new("p1");
        
        apply_malus(&mut state, 0.1, 0.5);
        
        assert!(state.malus_timer >= RUBBER_CONFIG.malus_duration);
    }

    #[test]
    fn test_calculate_effectiveness_high_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = RUBBER_CONFIG.max_rubber;
        state.malus = 0.0;
        
        let effectiveness = calculate_effectiveness(&state);
        assert!(effectiveness > 0.8);
    }

    #[test]
    fn test_calculate_effectiveness_low_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = RUBBER_CONFIG.min_rubber;
        state.malus = 0.0;
        
        let effectiveness = calculate_effectiveness(&state);
        assert!(effectiveness < 0.2);
    }

    #[test]
    fn test_calculate_effectiveness_with_malus() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        state.malus = 0.5;
        state.malus_timer = 1.0;
        
        let with_malus = calculate_effectiveness(&state);
        
        state.malus = 0.0;
        state.malus_timer = 0.0;
        let without_malus = calculate_effectiveness(&state);
        
        assert!(with_malus < without_malus);
    }

    #[test]
    fn test_validate_rubber_usage_within_tolerance() {
        let result = validate_rubber_usage(1.5, 1.55, 0.1);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_rubber_usage_exceeds_tolerance() {
        let result = validate_rubber_usage(1.0, 2.0, 0.5);
        assert!(result.is_err());
        
        if let Err(PhysicsError::RubberMismatch { client_value, server_value, tolerance }) = result {
            assert_eq!(client_value, 1.0);
            assert_eq!(server_value, 2.0);
            assert_eq!(tolerance, 0.5);
        } else {
            panic!("Expected RubberMismatch error");
        }
    }

    #[test]
    fn test_calculate_speed_modifier_base() {
        let state = RubberState::new("p1");
        let speed = calculate_speed_modifier(&state, 40.0);
        assert!((speed - 40.0).abs() < 1.0);
    }

    #[test]
    fn test_calculate_speed_modifier_with_boost() {
        let mut state = RubberState::new("p1");
        state.rubber = 4.0;
        
        let speed = calculate_speed_modifier(&state, 40.0);
        assert!(speed > 40.0);
    }

    #[test]
    fn test_get_effective_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = 3.0;
        state.malus = 0.5;
        
        let effective = get_effective_rubber(&state);
        assert_eq!(effective, 2.5);
    }

    #[test]
    fn test_reset_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = 4.5;
        state.malus = 0.8;
        state.malus_timer = 2.0;
        
        reset_rubber(&mut state);
        
        assert_eq!(state.rubber, RUBBER_CONFIG.base_rubber);
        assert_eq!(state.malus, 0.0);
        assert_eq!(state.malus_timer, 0.0);
    }

    #[test]
    fn test_increase_rubber_for_position_last_place() {
        let mut state = RubberState::new("p1");
        let initial = state.rubber;
        
        increase_rubber_for_position(&mut state, 6, 6);
        
        assert!(state.rubber > initial);
    }

    #[test]
    fn test_increase_rubber_for_position_first_place() {
        let mut state = RubberState::new("p1");
        let initial = state.rubber;
        
        increase_rubber_for_position(&mut state, 1, 6);
        
        assert!(state.rubber <= initial + EPS);
    }
}

// ============================================================================
// COLLISION DETECTION TESTS (25 tests)
// ============================================================================

mod test_collision_detection {
    use super::*;

    #[test]
    fn test_eps_constant_value() {
        assert_eq!(collision::EPS, 0.01);
    }

    #[test]
    fn test_segment_creation() {
        let seg = Segment::new(0.0, 0.0, 10.0, 10.0);
        assert_eq!(seg.start_x, 0.0);
        assert_eq!(seg.start_z, 0.0);
        assert_eq!(seg.end_x, 10.0);
        assert_eq!(seg.end_z, 10.0);
    }

    #[test]
    fn test_segment_from_positions() {
        let seg = Segment::from_positions(1.0, 2.0, 3.0, 4.0);
        assert_eq!(seg.start_x, 1.0);
        assert_eq!(seg.start_z, 2.0);
        assert_eq!(seg.end_x, 3.0);
        assert_eq!(seg.end_z, 4.0);
    }

    #[test]
    fn test_segment_length_calculation() {
        let seg = Segment::new(0.0, 0.0, 3.0, 4.0);
        assert!((seg.length() - 5.0).abs() < EPS);
    }

    #[test]
    fn test_segment_length_zero() {
        let seg = Segment::new(5.0, 5.0, 5.0, 5.0);
        assert!((seg.length() - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_point_on_start() {
        let dist = collision::distance_to_segment(0.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_point_on_end() {
        let dist = collision::distance_to_segment(10.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_point_on_line() {
        let dist = collision::distance_to_segment(5.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_perpendicular() {
        let dist = collision::distance_to_segment(5.0, 3.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 3.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_beyond_start() {
        let dist = collision::distance_to_segment(-5.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 5.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_beyond_end() {
        let dist = collision::distance_to_segment(15.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 5.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_squared() {
        let dist_sq = collision::distance_to_segment_squared(3.0, 4.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist_sq - 16.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_struct() {
        let seg = Segment::new(0.0, 0.0, 10.0, 0.0);
        let dist = collision::distance_to_segment_struct(5.0, 3.0, &seg);
        assert!((dist - 3.0).abs() < EPS);
    }

    #[test]
    fn test_player_state_creation() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 1.0, 0.0, true);
        assert_eq!(player.id, "p1");
        assert_eq!(player.x, 0.0);
        assert_eq!(player.dir_x, 1.0);
        assert!(player.alive);
    }

    #[test]
    fn test_collision_result_default() {
        let result = CollisionResult::default();
        assert!(!result.collided);
        assert!(result.collision_type.is_none());
        assert_eq!(result.distance, f32::MAX);
    }

    #[test]
    fn test_check_trail_collision_no_hit() {
        let player = PlayerState::new("p1".to_string(), 0.0, 10.0, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = collision::check_trail_collision(&player, &segments, 2.0);
        assert!(!result.collided);
    }

    #[test]
    fn test_check_trail_collision_hit() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = collision::check_trail_collision(&player, &segments, 2.0);
        assert!(result.collided);
        assert_eq!(result.segment_index, Some(0));
    }

    #[test]
    fn test_check_trail_collision_dead_player() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.0, 0.0, 1.0, false);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = collision::check_trail_collision(&player, &segments, 2.0);
        assert!(!result.collided);
    }

    #[test]
    fn test_check_trail_collision_with_owner_self() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = collision::check_trail_collision_with_owner(&player, "p1", &segments, 2.0);
        assert!(result.collided);
        assert_eq!(result.collision_type, Some(CollisionType::SelfTrail));
    }

    #[test]
    fn test_check_trail_collision_with_owner_other() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = collision::check_trail_collision_with_owner(&player, "p2", &segments, 2.0);
        assert!(result.collided);
        assert_eq!(result.collision_type, Some(CollisionType::OtherTrail("p2".to_string())));
    }

    #[test]
    fn test_continuous_collision_intersect() {
        let segments = [Segment::new(0.0, 0.0, 10.0, 10.0)];
        
        // Movement crosses the segment
        let result = collision::continuous_collision_check(0.0, 10.0, 10.0, 0.0, &segments);
        assert!(result.collided);
    }

    #[test]
    fn test_continuous_collision_no_intersect() {
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        // Movement parallel and away
        let result = collision::continuous_collision_check(0.0, 5.0, 10.0, 5.0, &segments);
        assert!(!result.collided);
    }

    #[test]
    fn test_segments_intersect_cross() {
        let s1 = Segment::new(0.0, 0.0, 10.0, 10.0);
        let s2 = Segment::new(0.0, 10.0, 10.0, 0.0);
        
        assert!(collision::segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_segments_intersect_parallel() {
        let s1 = Segment::new(0.0, 0.0, 10.0, 0.0);
        let s2 = Segment::new(0.0, 1.0, 10.0, 1.0);
        
        assert!(!collision::segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_segments_intersect_touch_endpoints() {
        let s1 = Segment::new(0.0, 0.0, 5.0, 5.0);
        let s2 = Segment::new(5.0, 5.0, 10.0, 0.0);
        
        assert!(collision::segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_check_arena_bounds_inside() {
        let result = collision::check_arena_bounds(50.0, 50.0, 100.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_arena_bounds_outside() {
        let result = collision::check_arena_bounds(150.0, 50.0, 100.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_check_arena_bounds_edge() {
        let result = collision::check_arena_bounds(98.0, 50.0, 100.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_wall_collision_safe() {
        assert!(!collision::check_wall_collision(50.0, 50.0, 100.0, 5.0));
    }

    #[test]
    fn test_check_wall_collision_hit() {
        assert!(collision::check_wall_collision(98.0, 50.0, 100.0, 5.0));
    }

    #[test]
    fn test_check_slipstream_behind() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 0.0, 1.0, true);
        let leader = PlayerState::new("p2".to_string(), 0.0, 3.0, 0.0, 1.0, true);
        
        assert!(collision::check_slipstream(&player, &leader, 5.0, 0.3));
    }

    #[test]
    fn test_check_slipstream_too_far() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 0.0, 1.0, true);
        let leader = PlayerState::new("p2".to_string(), 0.0, 10.0, 0.0, 1.0, true);
        
        assert!(!collision::check_slipstream(&player, &leader, 5.0, 0.3));
    }

    #[test]
    fn test_check_slipstream_wrong_angle() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 1.0, 0.0, true);
        let leader = PlayerState::new("p2".to_string(), 0.0, 3.0, 0.0, 1.0, true);
        
        assert!(!collision::check_slipstream(&player, &leader, 5.0, 0.3));
    }

    #[test]
    fn test_find_closest_segment() {
        let segments = [
            Segment::new(0.0, 0.0, 10.0, 0.0),
            Segment::new(0.0, 10.0, 10.0, 10.0),
        ];
        
        let result = collision::find_closest_segment(5.0, 1.0, &segments);
        assert_eq!(result.unwrap().0, 0);
    }

    #[test]
    fn test_find_closest_segment_empty() {
        let segments: [Segment; 0] = [];
        assert!(collision::find_closest_segment(0.0, 0.0, &segments).is_none());
    }

    #[test]
    fn test_collision_config_constants() {
        assert_eq!(collision::COLLISION_CONFIG.death_radius, 2.0);
        assert_eq!(collision::COLLISION_CONFIG.bike_collision_dist, 3.0);
        assert_eq!(collision::COLLISION_CONFIG.trail_collision_dist, 2.5);
    }
}

// ============================================================================
// CONFIG VALIDATION TESTS (10 tests)
// ============================================================================

mod test_config_validation {
    use super::*;

    #[test]
    fn test_physics_config_default_values() {
        let config = PhysicsConfig::default();
        assert_eq!(config.base_speed, 40.0);
        assert_eq!(config.boost_speed, 70.0);
        assert_eq!(config.brake_speed, 20.0);
        assert_eq!(config.turn_speed, 3.0);
    }

    #[test]
    fn test_physics_config_validate_success() {
        let config = PhysicsConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_physics_config_validate_invalid_base_speed() {
        let config = PhysicsConfig { base_speed: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_collision_config_default_values() {
        let config = CollisionConfig::default();
        assert_eq!(config.death_radius, 2.0);
        assert_eq!(config.trail_collision_dist, 2.5);
    }

    #[test]
    fn test_collision_config_validate_success() {
        let config = CollisionConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_collision_config_validate_invalid_death_radius() {
        let config = CollisionConfig { death_radius: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_rubber_config_default_values() {
        let config = RubberConfig::default();
        assert_eq!(config.base_rubber, 1.0);
        assert_eq!(config.server_rubber, 3.0);
        assert_eq!(config.max_rubber, 5.0);
    }

    #[test]
    fn test_rubber_config_validate_success() {
        let config = RubberConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_rubber_config_validate_invalid_decay_rate() {
        let config = RubberConfig { decay_rate: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_full_physics_config_competitive() {
        let config = FullPhysicsConfig::competitive();
        assert!(config.validate().is_ok());
        assert_eq!(config.physics.base_speed, 40.0);
        assert_eq!(config.collision.death_radius, 2.0);
    }

    #[test]
    fn test_full_physics_config_casual() {
        let config = FullPhysicsConfig::casual();
        assert!(config.validate().is_ok());
        assert_eq!(config.physics.base_speed, 35.0);
        assert_eq!(config.rubber.max_rubber, 6.0);
    }

    #[test]
    fn test_physics_config_get_target_speed() {
        let config = PhysicsConfig::default();
        
        assert_eq!(config.get_target_speed(false, false), config.base_speed);
        assert_eq!(config.get_target_speed(true, false), config.boost_speed);
        assert_eq!(config.get_target_speed(false, true), config.brake_speed);
    }

    #[test]
    fn test_physics_config_calculate_turn_angle() {
        let config = PhysicsConfig::default();
        let dt = 0.1;
        
        let left = config.calculate_turn_angle(dt, true, false);
        assert!((left - 0.3).abs() < EPS);
        
        let right = config.calculate_turn_angle(dt, false, true);
        assert!((right - (-0.3)).abs() < EPS);
    }

    #[test]
    fn test_rubber_config_position_bonus() {
        let config = RubberConfig::default();
        
        let first = config.calculate_position_bonus(1, 6);
        let last = config.calculate_position_bonus(6, 6);
        
        assert!(first > last);
    }
}

// ============================================================================
// SERVER VALIDATION TESTS (10+ tests)
// ============================================================================

mod test_server_validation {
    use super::*;

    #[test]
    fn test_validate_physics_state_valid_position() {
        let result = physics::validate_physics_state("p1", 50.0, 50.0, 200.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_physics_state_out_of_bounds() {
        let result = physics::validate_physics_state("p1", 250.0, 250.0, 200.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_physics_state_edge_position() {
        let result = physics::validate_physics_state("p1", 195.0, 50.0, 200.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_physics_error_rubber_mismatch() {
        let err = PhysicsError::RubberMismatch {
            client_value: 1.0,
            server_value: 2.0,
            tolerance: 0.5,
        };
        
        let msg = err.to_string();
        assert!(msg.contains("Rubber mismatch"));
        assert!(msg.contains("1"));
        assert!(msg.contains("2"));
    }

    #[test]
    fn test_physics_error_collision() {
        let err = PhysicsError::Collision {
            player_id: "p1".to_string(),
            collision_type: CollisionType::SelfTrail,
        };
        
        let msg = err.to_string();
        assert!(msg.contains("Collision"));
        assert!(msg.contains("p1"));
    }

    #[test]
    fn test_physics_error_out_of_bounds() {
        let err = PhysicsError::OutOfBounds {
            x: 250.0,
            z: 250.0,
            arena_size: 200.0,
        };
        
        let msg = err.to_string();
        assert!(msg.contains("Out of bounds"));
        assert!(msg.contains("250"));
    }

    #[test]
    fn test_physics_error_invalid_config() {
        let err = PhysicsError::InvalidConfig("test error".to_string());
        
        let msg = err.to_string();
        assert!(msg.contains("Invalid config"));
        assert!(msg.contains("test error"));
    }

    #[test]
    fn test_collision_type_debug_format() {
        let self_trail = CollisionType::SelfTrail;
        assert_eq!(format!("{:?}", self_trail), "SelfTrail");
        
        let other = CollisionType::OtherTrail("p2".to_string());
        assert!(format!("{:?}", other).contains("p2"));
        
        let wall = CollisionType::Wall;
        assert_eq!(format!("{:?}", wall), "Wall");
    }

    #[test]
    fn test_rubber_config_validation_tolerance() {
        let config = RubberConfig::default();
        let tolerance = config.get_validation_tolerance();
        assert!(tolerance > 0.0);
        assert!(tolerance < 1.0);
    }

    #[test]
    fn test_server_rubber_constant() {
        assert_eq!(RUBBER_CONFIG.server_rubber, 3.0);
        assert_eq!(RUBBER_CONFIG.base_rubber, 1.0);
    }

    #[test]
    fn test_speed_validation_within_limits() {
        let config = PhysicsConfig::default();
        let speed = config.base_speed;
        
        assert!(speed <= config.max_speed);
        assert!(speed >= config.min_speed);
    }

    #[test]
    fn test_speed_validation_boost_exceeds_base() {
        let config = PhysicsConfig::default();
        assert!(config.boost_speed > config.base_speed);
    }

    #[test]
    fn test_speed_validation_brake_below_base() {
        let config = PhysicsConfig::default();
        assert!(config.brake_speed < config.base_speed);
    }

    #[test]
    fn test_collision_distances_ordered() {
        let config = CollisionConfig::default();
        // Death radius should be reasonable for gameplay
        assert!(config.death_radius > 0.5);
        assert!(config.death_radius < 10.0);
    }

    #[test]
    fn test_rubber_decay_is_exponential() {
        let mut state = RubberState::new("p1");
        state.rubber = 5.0;
        
        let initial = state.rubber;
        update_rubber(&mut state, 1.0, None);
        let after_1s = state.rubber;
        
        update_rubber(&mut state, 1.0, None);
        let after_2s = state.rubber;
        
        // Verify exponential decay pattern
        let ratio1 = after_1s / initial;
        let ratio2 = after_2s / after_1s;
        
        assert!((ratio1 - ratio2).abs() < 0.05); // Should be similar ratios
    }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

mod test_integration {
    use super::*;

    #[test]
    fn test_rubber_and_collision_together() {
        let mut state = RubberState::new("p1");
        state.rubber = 3.0;
        
        // Apply malus from collision
        apply_malus(&mut state, 1.0, 0.5);
        
        // Verify malus affects effectiveness
        let effectiveness = calculate_effectiveness(&state);
        assert!(effectiveness < 1.0);
    }

    #[test]
    fn test_full_config_validation() {
        let config = FullPhysicsConfig::competitive();
        
        assert!(config.physics.validate().is_ok());
        assert!(config.collision.validate().is_ok());
        assert!(config.rubber.validate().is_ok());
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_collision_with_rubber_state() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = collision::check_trail_collision(&player, &segments, 2.0);
        assert!(result.collided);
        
        // Apply malus for collision
        let mut state = RubberState::new("p1");
        apply_malus(&mut state, RUBBER_CONFIG.malus_duration, RUBBER_CONFIG.malus_factor);
        assert!(state.malus > 0.0);
    }

    #[test]
    fn test_arena_bounds_with_collision() {
        // Position inside bounds
        assert!(collision::check_arena_bounds(50.0, 50.0, 100.0).is_ok());
        assert!(!collision::check_wall_collision(50.0, 50.0, 100.0, 5.0));
        
        // Position near wall
        assert!(collision::check_arena_bounds(95.0, 50.0, 100.0).is_ok());
        assert!(collision::check_wall_collision(96.0, 50.0, 100.0, 5.0));
        
        // Position outside bounds
        assert!(collision::check_arena_bounds(150.0, 50.0, 100.0).is_err());
    }

    #[test]
    fn test_multiple_players_collision_scenario() {
        let player1 = PlayerState::new("p1".to_string(), 0.0, 0.0, 0.0, 1.0, true);
        let player2 = PlayerState::new("p2".to_string(), 10.0, 0.0, 0.0, 1.0, true);
        
        let trail1 = [Segment::new(0.0, 0.0, 5.0, 0.0)];
        let trail2 = [Segment::new(10.0, 0.0, 15.0, 0.0)];
        
        // Player 1 should not collide with player 2's trail
        let result = collision::check_trail_collision(&player1, &trail2, 2.0);
        assert!(!result.collided);
        
        // Player 2 should not collide with player 1's trail
        let result = collision::check_trail_collision(&player2, &trail1, 2.0);
        assert!(!result.collided);
    }
}
