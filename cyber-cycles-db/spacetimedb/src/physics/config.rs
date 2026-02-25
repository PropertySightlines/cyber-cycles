//! Configuration structs for physics system
//!
//! This module provides configuration structures for:
//! - Physics parameters (speeds, turn rates)
//! - Collision detection thresholds
//! - Rubber banding settings

use crate::physics::PhysicsError;

/// Physics configuration for bike movement
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PhysicsConfig {
    /// Base movement speed (units per second)
    pub base_speed: f32,
    /// Boost speed when accelerating (units per second)
    pub boost_speed: f32,
    /// Brake speed when decelerating (units per second)
    pub brake_speed: f32,
    /// Turn speed in radians per second
    pub turn_speed: f32,
    /// Delay before turn penalty applies (seconds)
    pub turn_delay: f32,
    /// Speed penalty during turns (0.0 to 1.0)
    pub turn_penalty: f32,
    /// Acceleration rate (units per second squared)
    pub acceleration: f32,
    /// Deceleration rate (units per second squared)
    pub deceleration: f32,
    /// Minimum speed before stopping
    pub min_speed: f32,
    /// Maximum speed cap
    pub max_speed: f32,
}

impl Default for PhysicsConfig {
    fn default() -> Self {
        Self {
            base_speed: 40.0,
            boost_speed: 70.0,
            brake_speed: 20.0,
            turn_speed: 3.0,
            turn_delay: 0.08,
            turn_penalty: 0.05,
            acceleration: 100.0,
            deceleration: 80.0,
            min_speed: 5.0,
            max_speed: 80.0,
        }
    }
}

impl PhysicsConfig {
    /// Create a new physics config with custom values
    pub fn new(
        base_speed: f32,
        boost_speed: f32,
        brake_speed: f32,
        turn_speed: f32,
    ) -> Self {
        Self {
            base_speed,
            boost_speed,
            brake_speed,
            turn_speed,
            ..Default::default()
        }
    }

    /// Validate the physics configuration
    ///
    /// # Returns
    /// * `Ok(())` if configuration is valid
    /// * `Err` with details if invalid
    pub fn validate(&self) -> Result<(), PhysicsError> {
        if self.base_speed <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "base_speed must be positive".to_string()
            ));
        }
        
        if self.boost_speed <= self.base_speed {
            return Err(PhysicsError::InvalidConfig(
                "boost_speed must be greater than base_speed".to_string()
            ));
        }
        
        if self.brake_speed >= self.base_speed {
            return Err(PhysicsError::InvalidConfig(
                "brake_speed must be less than base_speed".to_string()
            ));
        }
        
        if self.turn_speed <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "turn_speed must be positive".to_string()
            ));
        }
        
        if self.turn_delay < 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "turn_delay cannot be negative".to_string()
            ));
        }
        
        if self.turn_penalty < 0.0 || self.turn_penalty > 1.0 {
            return Err(PhysicsError::InvalidConfig(
                "turn_penalty must be between 0.0 and 1.0".to_string()
            ));
        }
        
        if self.acceleration <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "acceleration must be positive".to_string()
            ));
        }
        
        if self.deceleration <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "deceleration must be positive".to_string()
            ));
        }
        
        if self.min_speed < 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "min_speed cannot be negative".to_string()
            ));
        }
        
        if self.max_speed <= self.min_speed {
            return Err(PhysicsError::InvalidConfig(
                "max_speed must be greater than min_speed".to_string()
            ));
        }
        
        Ok(())
    }

    /// Get the speed for current input state
    ///
    /// # Arguments
    /// * `is_boosting` - Whether player is boosting
    /// * `is_braking` - Whether player is braking
    ///
    /// # Returns
    /// Target speed value
    pub fn get_target_speed(&self, is_boosting: bool, is_braking: bool) -> f32 {
        if is_boosting {
            self.boost_speed
        } else if is_braking {
            self.brake_speed
        } else {
            self.base_speed
        }
    }

    /// Calculate turn angle for a given delta time
    ///
    /// # Arguments
    /// * `dt` - Delta time in seconds
    /// * `turning_left` - Whether turning left
    /// * `turning_right` - Whether turning right
    ///
    /// # Returns
    /// Angle to turn in radians (positive = left, negative = right)
    pub fn calculate_turn_angle(&self, dt: f32, turning_left: bool, turning_right: bool) -> f32 {
        if turning_left && !turning_right {
            self.turn_speed * dt
        } else if turning_right && !turning_left {
            -self.turn_speed * dt
        } else {
            0.0
        }
    }

    /// Apply turn penalty to speed
    ///
    /// # Arguments
    /// * `current_speed` - Current speed before penalty
    /// * `is_turning` - Whether currently turning
    ///
    /// # Returns
    /// Speed after penalty application
    pub fn apply_turn_penalty(&self, current_speed: f32, is_turning: bool) -> f32 {
        if is_turning {
            current_speed * (1.0 - self.turn_penalty)
        } else {
            current_speed
        }
    }
}

/// Collision detection configuration
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CollisionConfig {
    /// Death radius for trail collision (units)
    pub death_radius: f32,
    /// Minimum distance between bikes (units)
    pub bike_collision_dist: f32,
    /// Trail collision detection distance (units)
    pub trail_collision_dist: f32,
    /// Distance from wall to trigger collision (units)
    pub wall_collision_dist: f32,
    /// Maximum distance for slipstream effect (units)
    pub slipstream_distance: f32,
    /// Maximum angle for slipstream effect (radians, cos value)
    pub slipstream_angle: f32,
}

impl Default for CollisionConfig {
    fn default() -> Self {
        Self {
            death_radius: 2.0,
            bike_collision_dist: 3.0,
            trail_collision_dist: 2.5,
            wall_collision_dist: 1.0,
            slipstream_distance: 5.0,
            slipstream_angle: 0.3,
        }
    }
}

impl CollisionConfig {
    /// Create a new collision config with custom values
    pub fn new(death_radius: f32, trail_collision_dist: f32) -> Self {
        Self {
            death_radius,
            trail_collision_dist,
            ..Default::default()
        }
    }

    /// Validate the collision configuration
    ///
    /// # Returns
    /// * `Ok(())` if configuration is valid
    /// * `Err` with details if invalid
    pub fn validate(&self) -> Result<(), PhysicsError> {
        if self.death_radius <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "death_radius must be positive".to_string()
            ));
        }
        
        if self.bike_collision_dist <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "bike_collision_dist must be positive".to_string()
            ));
        }
        
        if self.trail_collision_dist <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "trail_collision_dist must be positive".to_string()
            ));
        }
        
        if self.wall_collision_dist <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "wall_collision_dist must be positive".to_string()
            ));
        }
        
        if self.slipstream_distance <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "slipstream_distance must be positive".to_string()
            ));
        }
        
        if self.slipstream_angle <= 0.0 || self.slipstream_angle > std::f32::consts::PI / 2.0 {
            return Err(PhysicsError::InvalidConfig(
                "slipstream_angle must be between 0 and PI/2".to_string()
            ));
        }
        
        Ok(())
    }

    /// Get squared death radius for efficient comparison
    pub fn death_radius_squared(&self) -> f32 {
        self.death_radius * self.death_radius
    }

    /// Get squared trail collision distance
    pub fn trail_collision_dist_squared(&self) -> f32 {
        self.trail_collision_dist * self.trail_collision_dist
    }
}

/// Rubber banding configuration
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RubberConfig {
    /// Base rubber value (no advantage/disadvantage)
    pub base_rubber: f32,
    /// Server-side rubber value for validation
    pub server_rubber: f32,
    /// Speed multiplier for rubber effect
    pub rubber_speed: f32,
    /// Minimum distance threshold
    pub min_distance: f32,
    /// Duration of malus effect (seconds)
    pub malus_duration: f32,
    /// Factor for malus calculation
    pub malus_factor: f32,
    /// Decay rate per second (0.0 to 1.0)
    pub decay_rate: f32,
    /// Maximum rubber value
    pub max_rubber: f32,
    /// Minimum rubber value
    pub min_rubber: f32,
    /// Threshold for effectiveness calculation
    pub effectiveness_threshold: f32,
}

impl Default for RubberConfig {
    fn default() -> Self {
        Self {
            base_rubber: 1.0,
            server_rubber: 3.0,
            rubber_speed: 40.0,
            min_distance: 0.001,
            malus_duration: 0.5,
            malus_factor: 0.3,
            decay_rate: 0.95,
            max_rubber: 5.0,
            min_rubber: 0.1,
            effectiveness_threshold: 0.5,
        }
    }
}

impl RubberConfig {
    /// Create a new rubber config with custom values
    pub fn new(base_rubber: f32, server_rubber: f32, max_rubber: f32) -> Self {
        Self {
            base_rubber,
            server_rubber,
            max_rubber,
            ..Default::default()
        }
    }

    /// Validate the rubber configuration
    ///
    /// # Returns
    /// * `Ok(())` if configuration is valid
    /// * `Err` with details if invalid
    pub fn validate(&self) -> Result<(), PhysicsError> {
        if self.base_rubber <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "base_rubber must be positive".to_string()
            ));
        }
        
        if self.server_rubber <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "server_rubber must be positive".to_string()
            ));
        }
        
        if self.rubber_speed <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "rubber_speed must be positive".to_string()
            ));
        }
        
        if self.min_distance <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "min_distance must be positive".to_string()
            ));
        }
        
        if self.malus_duration <= 0.0 {
            return Err(PhysicsError::InvalidConfig(
                "malus_duration must be positive".to_string()
            ));
        }
        
        if self.malus_factor < 0.0 || self.malus_factor > 1.0 {
            return Err(PhysicsError::InvalidConfig(
                "malus_factor must be between 0.0 and 1.0".to_string()
            ));
        }
        
        if self.decay_rate <= 0.0 || self.decay_rate > 1.0 {
            return Err(PhysicsError::InvalidConfig(
                "decay_rate must be between 0.0 and 1.0".to_string()
            ));
        }
        
        if self.max_rubber <= self.base_rubber {
            return Err(PhysicsError::InvalidConfig(
                "max_rubber must be greater than base_rubber".to_string()
            ));
        }
        
        if self.min_rubber <= 0.0 || self.min_rubber >= self.base_rubber {
            return Err(PhysicsError::InvalidConfig(
                "min_rubber must be positive and less than base_rubber".to_string()
            ));
        }
        
        if self.effectiveness_threshold < 0.0 || self.effectiveness_threshold > 1.0 {
            return Err(PhysicsError::InvalidConfig(
                "effectiveness_threshold must be between 0.0 and 1.0".to_string()
            ));
        }
        
        Ok(())
    }

    /// Get the rubber tolerance for validation
    pub fn get_validation_tolerance(&self) -> f32 {
        (self.max_rubber - self.min_rubber) * 0.1
    }

    /// Calculate rubber increase based on position
    ///
    /// # Arguments
    /// * `position` - Current race position (1 = first)
    /// * `total_players` - Total number of players
    ///
    /// # Returns
    /// Rubber increase factor
    pub fn calculate_position_bonus(&self, position: u32, total_players: u32) -> f32 {
        if total_players == 0 || position == 0 {
            return 0.0;
        }
        
        let position_factor = (total_players - position) as f32 / total_players as f32;
        position_factor * 0.1 // 10% max increase
    }
}

/// Complete physics configuration bundle
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FullPhysicsConfig {
    pub physics: PhysicsConfig,
    pub collision: CollisionConfig,
    pub rubber: RubberConfig,
}

impl Default for FullPhysicsConfig {
    fn default() -> Self {
        Self {
            physics: PhysicsConfig::default(),
            collision: CollisionConfig::default(),
            rubber: RubberConfig::default(),
        }
    }
}

impl FullPhysicsConfig {
    /// Validate all configuration sections
    ///
    /// # Returns
    /// * `Ok(())` if all configurations are valid
    /// * `Err` with details of first validation failure
    pub fn validate(&self) -> Result<(), PhysicsError> {
        self.physics.validate()?;
        self.collision.validate()?;
        self.rubber.validate()?;
        Ok(())
    }

    /// Create competitive configuration preset
    pub fn competitive() -> Self {
        Self {
            physics: PhysicsConfig {
                base_speed: 40.0,
                boost_speed: 70.0,
                brake_speed: 20.0,
                turn_speed: 3.0,
                turn_delay: 0.08,
                turn_penalty: 0.05,
                acceleration: 100.0,
                deceleration: 80.0,
                min_speed: 5.0,
                max_speed: 80.0,
            },
            collision: CollisionConfig {
                death_radius: 2.0,
                bike_collision_dist: 3.0,
                trail_collision_dist: 2.5,
                wall_collision_dist: 1.0,
                slipstream_distance: 5.0,
                slipstream_angle: 0.3,
            },
            rubber: RubberConfig {
                base_rubber: 1.0,
                server_rubber: 3.0,
                rubber_speed: 40.0,
                min_distance: 0.001,
                malus_duration: 0.5,
                malus_factor: 0.3,
                decay_rate: 0.95,
                max_rubber: 5.0,
                min_rubber: 0.1,
                effectiveness_threshold: 0.5,
            },
        }
    }

    /// Create casual/easier configuration preset
    pub fn casual() -> Self {
        Self {
            physics: PhysicsConfig {
                base_speed: 35.0,
                boost_speed: 60.0,
                brake_speed: 15.0,
                turn_speed: 3.5,
                turn_delay: 0.1,
                turn_penalty: 0.02,
                acceleration: 80.0,
                deceleration: 60.0,
                min_speed: 5.0,
                max_speed: 70.0,
            },
            collision: CollisionConfig {
                death_radius: 2.5,
                bike_collision_dist: 4.0,
                trail_collision_dist: 3.0,
                wall_collision_dist: 1.5,
                slipstream_distance: 6.0,
                slipstream_angle: 0.4,
            },
            rubber: RubberConfig {
                base_rubber: 1.0,
                server_rubber: 4.0,
                rubber_speed: 50.0,
                min_distance: 0.001,
                malus_duration: 0.3,
                malus_factor: 0.2,
                decay_rate: 0.9,
                max_rubber: 6.0,
                min_rubber: 0.1,
                effectiveness_threshold: 0.4,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // PhysicsConfig Tests
    // ========================================================================

    #[test]
    fn test_physics_config_default() {
        let config = PhysicsConfig::default();
        assert_eq!(config.base_speed, 40.0);
        assert_eq!(config.boost_speed, 70.0);
        assert_eq!(config.brake_speed, 20.0);
        assert_eq!(config.turn_speed, 3.0);
    }

    #[test]
    fn test_physics_config_new() {
        let config = PhysicsConfig::new(50.0, 80.0, 25.0, 4.0);
        assert_eq!(config.base_speed, 50.0);
        assert_eq!(config.boost_speed, 80.0);
        assert_eq!(config.brake_speed, 25.0);
        assert_eq!(config.turn_speed, 4.0);
    }

    #[test]
    fn test_physics_config_validate_success() {
        let config = PhysicsConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_physics_config_validate_base_speed_zero() {
        let config = PhysicsConfig { base_speed: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_physics_config_validate_boost_less_than_base() {
        let config = PhysicsConfig { boost_speed: 30.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_physics_config_validate_brake_greater_than_base() {
        let config = PhysicsConfig { brake_speed: 50.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_physics_config_validate_turn_speed_zero() {
        let config = PhysicsConfig { turn_speed: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_physics_config_validate_turn_delay_negative() {
        let config = PhysicsConfig { turn_delay: -0.1, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_physics_config_validate_turn_penalty_invalid() {
        let config_low = PhysicsConfig { turn_penalty: -0.1, ..Default::default() };
        let config_high = PhysicsConfig { turn_penalty: 1.5, ..Default::default() };
        assert!(config_low.validate().is_err());
        assert!(config_high.validate().is_err());
    }

    #[test]
    fn test_physics_config_get_target_speed() {
        let config = PhysicsConfig::default();
        
        assert_eq!(config.get_target_speed(false, false), config.base_speed);
        assert_eq!(config.get_target_speed(true, false), config.boost_speed);
        assert_eq!(config.get_target_speed(false, true), config.brake_speed);
        assert_eq!(config.get_target_speed(true, true), config.boost_speed);
    }

    #[test]
    fn test_physics_config_calculate_turn_angle() {
        let config = PhysicsConfig::default();
        let dt = 0.1;
        
        let left = config.calculate_turn_angle(dt, true, false);
        assert!((left - 0.3).abs() < 0.01);
        
        let right = config.calculate_turn_angle(dt, false, true);
        assert!((right - (-0.3)).abs() < 0.01);
        
        let straight = config.calculate_turn_angle(dt, false, false);
        assert_eq!(straight, 0.0);
        
        let both = config.calculate_turn_angle(dt, true, true);
        assert_eq!(both, 0.0);
    }

    #[test]
    fn test_physics_config_apply_turn_penalty() {
        let config = PhysicsConfig::default();
        
        let no_penalty = config.apply_turn_penalty(40.0, false);
        assert_eq!(no_penalty, 40.0);
        
        let with_penalty = config.apply_turn_penalty(40.0, true);
        assert!((with_penalty - 38.0).abs() < 0.01);
    }

    // ========================================================================
    // CollisionConfig Tests
    // ========================================================================

    #[test]
    fn test_collision_config_default() {
        let config = CollisionConfig::default();
        assert_eq!(config.death_radius, 2.0);
        assert_eq!(config.trail_collision_dist, 2.5);
    }

    #[test]
    fn test_collision_config_new() {
        let config = CollisionConfig::new(3.0, 4.0);
        assert_eq!(config.death_radius, 3.0);
        assert_eq!(config.trail_collision_dist, 4.0);
    }

    #[test]
    fn test_collision_config_validate_success() {
        let config = CollisionConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_collision_config_validate_death_radius_zero() {
        let config = CollisionConfig { death_radius: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_collision_config_validate_slipstream_angle_invalid() {
        let config_low = CollisionConfig { slipstream_angle: 0.0, ..Default::default() };
        let config_high = CollisionConfig { slipstream_angle: 2.0, ..Default::default() };
        assert!(config_low.validate().is_err());
        assert!(config_high.validate().is_err());
    }

    #[test]
    fn test_collision_config_squared_values() {
        let config = CollisionConfig::default();
        
        assert_eq!(config.death_radius_squared(), 4.0);
        assert_eq!(config.trail_collision_dist_squared(), 6.25);
    }

    // ========================================================================
    // RubberConfig Tests
    // ========================================================================

    #[test]
    fn test_rubber_config_default() {
        let config = RubberConfig::default();
        assert_eq!(config.base_rubber, 1.0);
        assert_eq!(config.server_rubber, 3.0);
        assert_eq!(config.max_rubber, 5.0);
    }

    #[test]
    fn test_rubber_config_new() {
        let config = RubberConfig::new(2.0, 4.0, 6.0);
        assert_eq!(config.base_rubber, 2.0);
        assert_eq!(config.server_rubber, 4.0);
        assert_eq!(config.max_rubber, 6.0);
    }

    #[test]
    fn test_rubber_config_validate_success() {
        let config = RubberConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_rubber_config_validate_base_rubber_zero() {
        let config = RubberConfig { base_rubber: 0.0, ..Default::default() };
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_rubber_config_validate_decay_rate_invalid() {
        let config_low = RubberConfig { decay_rate: 0.0, ..Default::default() };
        let config_high = RubberConfig { decay_rate: 1.5, ..Default::default() };
        assert!(config_low.validate().is_err());
        assert!(config_high.validate().is_err());
    }

    #[test]
    fn test_rubber_config_get_validation_tolerance() {
        let config = RubberConfig::default();
        let tolerance = config.get_validation_tolerance();
        assert!((tolerance - 0.49).abs() < 0.01);
    }

    #[test]
    fn test_rubber_config_calculate_position_bonus() {
        let config = RubberConfig::default();
        
        let first = config.calculate_position_bonus(1, 6);
        assert!((first - 0.0833).abs() < 0.01);
        
        let last = config.calculate_position_bonus(6, 6);
        assert_eq!(last, 0.0);
        
        let zero_players = config.calculate_position_bonus(1, 0);
        assert_eq!(zero_players, 0.0);
    }

    // ========================================================================
    // FullPhysicsConfig Tests
    // ========================================================================

    #[test]
    fn test_full_physics_config_default() {
        let config = FullPhysicsConfig::default();
        assert!(config.physics.validate().is_ok());
        assert!(config.collision.validate().is_ok());
        assert!(config.rubber.validate().is_ok());
    }

    #[test]
    fn test_full_physics_config_validate() {
        let config = FullPhysicsConfig::default();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_full_physics_config_competitive() {
        let config = FullPhysicsConfig::competitive();
        assert_eq!(config.physics.base_speed, 40.0);
        assert_eq!(config.physics.boost_speed, 70.0);
        assert_eq!(config.collision.death_radius, 2.0);
        assert_eq!(config.rubber.base_rubber, 1.0);
    }

    #[test]
    fn test_full_physics_config_casual() {
        let config = FullPhysicsConfig::casual();
        assert_eq!(config.physics.base_speed, 35.0);
        assert_eq!(config.physics.turn_speed, 3.5);
        assert_eq!(config.collision.death_radius, 2.5);
        assert_eq!(config.rubber.max_rubber, 6.0);
    }

    #[test]
    fn test_full_physics_config_validate_failure() {
        let mut config = FullPhysicsConfig::default();
        config.physics.base_speed = 0.0;
        assert!(config.validate().is_err());
    }
}
