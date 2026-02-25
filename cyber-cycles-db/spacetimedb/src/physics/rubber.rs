//! Rubber banding system for Cyber Cycles
//!
//! The rubber banding system provides catch-up mechanics by tracking
//! player performance and applying dynamic adjustments.

use crate::physics::config::RubberConfig;
use crate::physics::collision::EPS;

/// Rubber configuration constants
pub const RUBBER_CONFIG: RubberConfig = RubberConfig {
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
};

/// State of the rubber banding system for a player
#[derive(Debug, Clone, PartialEq)]
pub struct RubberState {
    /// Unique player identifier
    pub player_id: String,
    /// Current rubber value (catch-up multiplier)
    pub rubber: f32,
    /// Current malus (penalty) value
    pub malus: f32,
    /// Timer for malus duration (seconds)
    pub malus_timer: f32,
}

impl Default for RubberState {
    fn default() -> Self {
        Self {
            player_id: String::new(),
            rubber: RUBBER_CONFIG.base_rubber,
            malus: 0.0,
            malus_timer: 0.0,
        }
    }
}

impl RubberState {
    /// Create a new rubber state for a player
    pub fn new(player_id: impl Into<String>) -> Self {
        Self {
            player_id: player_id.into(),
            rubber: RUBBER_CONFIG.base_rubber,
            malus: 0.0,
            malus_timer: 0.0,
        }
    }

    /// Create a new rubber state with custom initial rubber
    pub fn with_rubber(player_id: impl Into<String>, rubber: f32) -> Self {
        Self {
            player_id: player_id.into(),
            rubber: rubber.clamp(RUBBER_CONFIG.min_rubber, RUBBER_CONFIG.max_rubber),
            malus: 0.0,
            malus_timer: 0.0,
        }
    }
}

/// Updates the rubber state with exponential decay
///
/// # Arguments
/// * `state` - Mutable reference to the rubber state
/// * `dt` - Delta time in seconds
/// * `config` - Rubber configuration (uses RUBBER_CONFIG if None)
///
/// # Returns
/// The updated rubber value after decay
pub fn update_rubber(state: &mut RubberState, dt: f32, config: Option<&RubberConfig>) -> f32 {
    let cfg = config.unwrap_or(&RUBBER_CONFIG);
    
    // Apply exponential decay to rubber
    let decay_factor = cfg.decay_rate.powf(dt);
    state.rubber *= decay_factor;
    
    // Clamp to valid range
    state.rubber = state.rubber.clamp(cfg.min_rubber, cfg.max_rubber);
    
    // Update malus timer
    if state.malus_timer > 0.0 {
        state.malus_timer -= dt;
        if state.malus_timer <= 0.0 {
            state.malus_timer = 0.0;
            state.malus = 0.0;
        }
    }
    
    state.rubber
}

/// Applies a malus (penalty) to the player after a turn
///
/// # Arguments
/// * `state` - Mutable reference to the rubber state
/// * `duration` - Duration of the malus in seconds
/// * `factor` - Malus factor (0.0 to 1.0, higher = more penalty)
///
/// # Returns
/// The applied malus value
pub fn apply_malus(state: &mut RubberState, duration: f32, factor: f32) -> f32 {
    let cfg = &RUBBER_CONFIG;
    
    // Clamp factor to valid range
    let clamped_factor = factor.clamp(0.0, 1.0);
    
    // Calculate malus based on current rubber and factor
    state.malus = state.rubber * clamped_factor * cfg.malus_factor;
    state.malus_timer = duration.max(cfg.malus_duration);
    
    state.malus
}

/// Calculates the current effectiveness of the rubber banding
///
/// Effectiveness is a value from 0.0 to 1.0 indicating how much
/// the rubber banding is helping the player.
///
/// # Arguments
/// * `state` - Reference to the rubber state
///
/// # Returns
/// Effectiveness value (0.0 to 1.0)
pub fn calculate_effectiveness(state: &RubberState) -> f32 {
    let cfg = &RUBBER_CONFIG;
    
    // Base effectiveness from rubber value
    let rubber_effectiveness = (state.rubber - cfg.min_rubber) 
        / (cfg.max_rubber - cfg.min_rubber);
    
    // Reduce effectiveness when malus is active
    let malus_reduction = if state.malus_timer > 0.0 {
        state.malus / state.rubber.max(cfg.min_rubber)
    } else {
        0.0
    };
    
    // Final effectiveness clamped to valid range
    (rubber_effectiveness - malus_reduction).clamp(0.0, 1.0)
}

/// Validates rubber usage for anti-cheat purposes
///
/// # Arguments
/// * `client_rubber` - Rubber value reported by client
/// * `server_rubber` - Server-calculated rubber value
/// * `tolerance` - Acceptable difference between values
///
/// # Returns
/// * `Ok(())` if values are within tolerance
/// * `Err` with details if values differ too much
pub fn validate_rubber_usage(
    client_rubber: f32,
    server_rubber: f32,
    tolerance: f32,
) -> Result<(), crate::physics::PhysicsError> {
    let diff = (client_rubber - server_rubber).abs();
    
    // Use >= with small epsilon for floating-point comparison
    // Values at or below tolerance pass
    if diff > tolerance + EPS {
        Err(crate::physics::PhysicsError::RubberMismatch {
            client_value: client_rubber,
            server_value: server_rubber,
            tolerance,
        })
    } else {
        Ok(())
    }
}

/// Calculates the speed modifier based on rubber state
///
/// # Arguments
/// * `state` - Reference to the rubber state
/// * `base_speed` - Base speed to modify
///
/// # Returns
/// Modified speed value
pub fn calculate_speed_modifier(state: &RubberState, base_speed: f32) -> f32 {
    let cfg = &RUBBER_CONFIG;
    
    // Rubber provides a speed boost
    let rubber_boost = (state.rubber - cfg.base_rubber) * cfg.rubber_speed * 0.01;
    
    // Malus reduces speed
    let malus_penalty = state.malus;
    
    // Apply modifier to base speed
    let modifier = 1.0 + rubber_boost - malus_penalty;
    
    base_speed * modifier.max(0.5) // Minimum 50% of base speed
}

/// Gets the effective rubber value accounting for malus
///
/// # Arguments
/// * `state` - Reference to the rubber state
///
/// # Returns
/// Effective rubber value
pub fn get_effective_rubber(state: &RubberState) -> f32 {
    (state.rubber - state.malus).max(RUBBER_CONFIG.min_rubber)
}

/// Resets the rubber state to default values
///
/// # Arguments
/// * `state` - Mutable reference to the rubber state
pub fn reset_rubber(state: &mut RubberState) {
    state.rubber = RUBBER_CONFIG.base_rubber;
    state.malus = 0.0;
    state.malus_timer = 0.0;
}

/// Increases rubber based on player performance (being behind)
///
/// # Arguments
/// * `state` - Mutable reference to the rubber state
/// * `position` - Current race position (1 = first place)
/// * `total_players` - Total number of players
///
/// # Returns
/// New rubber value
pub fn increase_rubber_for_position(
    state: &mut RubberState,
    position: u32,
    total_players: u32,
) -> f32 {
    let cfg = &RUBBER_CONFIG;

    if total_players == 0 || position == 0 {
        return state.rubber;
    }

    // Players further back get more rubber
    // Position 1 (first) gets 0 bonus, last position gets max bonus
    let position_factor = if position >= total_players {
        1.0  // Last place gets full bonus
    } else {
        (position - 1) as f32 / (total_players - 1) as f32  // Normalize 0 to 1
    };
    let increase = position_factor * 0.1; // 10% max increase per update

    state.rubber = (state.rubber + increase).clamp(cfg.min_rubber, cfg.max_rubber);
    state.rubber
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rubber_state_default() {
        let state = RubberState::default();
        assert_eq!(state.rubber, RUBBER_CONFIG.base_rubber);
        assert_eq!(state.malus, 0.0);
        assert_eq!(state.malus_timer, 0.0);
    }

    #[test]
    fn test_rubber_state_new() {
        let state = RubberState::new("player1");
        assert_eq!(state.player_id, "player1");
        assert_eq!(state.rubber, RUBBER_CONFIG.base_rubber);
    }

    #[test]
    fn test_rubber_state_with_rubber() {
        let state = RubberState::with_rubber("player1", 2.5);
        assert_eq!(state.rubber, 2.5);
    }

    #[test]
    fn test_rubber_state_with_rubber_clamped() {
        let state_low = RubberState::with_rubber("p1", 0.0);
        assert_eq!(state_low.rubber, RUBBER_CONFIG.min_rubber);
        
        let state_high = RubberState::with_rubber("p1", 10.0);
        assert_eq!(state_high.rubber, RUBBER_CONFIG.max_rubber);
    }

    #[test]
    fn test_update_rubber_decay() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        let new_rubber = update_rubber(&mut state, 1.0, None);
        assert!(new_rubber < 2.0); // Should decay
        assert!(new_rubber > RUBBER_CONFIG.min_rubber); // Should not go below min
    }

    #[test]
    fn test_update_rubber_clamps_to_max() {
        let mut state = RubberState::new("p1");
        state.rubber = RUBBER_CONFIG.max_rubber + 1.0;
        
        update_rubber(&mut state, 0.0, None);
        assert!(state.rubber <= RUBBER_CONFIG.max_rubber);
    }

    #[test]
    fn test_update_rubber_clamps_to_min() {
        let mut state = RubberState::new("p1");
        state.rubber = RUBBER_CONFIG.min_rubber - 0.1;
        
        update_rubber(&mut state, 0.0, None);
        assert!(state.rubber >= RUBBER_CONFIG.min_rubber);
    }

    #[test]
    fn test_update_rubber_malus_timer_decreases() {
        let mut state = RubberState::new("p1");
        state.malus_timer = 1.0;
        state.malus = 0.5;
        
        update_rubber(&mut state, 0.5, None);
        assert_eq!(state.malus_timer, 0.5);
        assert_eq!(state.malus, 0.5); // Malus unchanged while timer > 0
    }

    #[test]
    fn test_update_rubber_malus_clears_when_timer_expires() {
        let mut state = RubberState::new("p1");
        state.malus_timer = 0.3;
        state.malus = 0.5;
        
        update_rubber(&mut state, 0.5, None);
        assert_eq!(state.malus_timer, 0.0);
        assert_eq!(state.malus, 0.0);
    }

    #[test]
    fn test_apply_malus_sets_values() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        let malus = apply_malus(&mut state, 1.0, 0.5);
        assert!(malus > 0.0);
        assert_eq!(state.malus, malus);
        assert!(state.malus_timer > 0.0);
    }

    #[test]
    fn test_apply_malus_factor_clamped() {
        let mut state = RubberState::new("p1");
        
        // Factor > 1.0 should be clamped
        apply_malus(&mut state, 1.0, 1.5);
        let malus_high = state.malus;
        
        state.malus = 0.0;
        // Factor = 1.0
        apply_malus(&mut state, 1.0, 1.0);
        let malus_max = state.malus;
        
        assert_eq!(malus_high, malus_max); // Should be same due to clamping
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
    fn test_calculate_effectiveness_base() {
        let mut state = RubberState::new("p1");
        state.rubber = RUBBER_CONFIG.max_rubber;
        state.malus = 0.0;
        
        let effectiveness = calculate_effectiveness(&state);
        assert!(effectiveness > 0.5); // High rubber = high effectiveness
    }

    #[test]
    fn test_calculate_effectiveness_with_malus() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        state.malus = 0.5;
        state.malus_timer = 1.0;
        
        let effectiveness_with_malus = calculate_effectiveness(&state);
        
        state.malus = 0.0;
        state.malus_timer = 0.0;
        let effectiveness_no_malus = calculate_effectiveness(&state);
        
        assert!(effectiveness_with_malus < effectiveness_no_malus);
    }

    #[test]
    fn test_calculate_effectiveness_clamped() {
        let mut state = RubberState::new("p1");
        state.rubber = RUBBER_CONFIG.min_rubber;
        
        let effectiveness = calculate_effectiveness(&state);
        assert!(effectiveness >= 0.0);
        assert!(effectiveness <= 1.0);
    }

    #[test]
    fn test_validate_rubber_usage_valid() {
        let result = validate_rubber_usage(1.5, 1.55, 0.1);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_rubber_usage_invalid() {
        let result = validate_rubber_usage(1.0, 2.0, 0.5);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_rubber_usage_exact_tolerance() {
        // Use values that don't have floating-point precision issues
        let result = validate_rubber_usage(1.0, 1.1, 0.1);
        assert!(result.is_ok()); // Exactly at tolerance should pass
    }

    #[test]
    fn test_validate_rubber_usage_just_over_tolerance() {
        let result = validate_rubber_usage(1.5, 1.61, 0.1);
        assert!(result.is_err()); // Just over tolerance should fail
    }

    #[test]
    fn test_calculate_speed_modifier_base() {
        let state = RubberState::new("p1");
        let modifier = calculate_speed_modifier(&state, 40.0);
        assert!((modifier - 40.0).abs() < 0.01); // Should be close to base
    }

    #[test]
    fn test_calculate_speed_modifier_with_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = 3.0;
        
        let modifier = calculate_speed_modifier(&state, 40.0);
        assert!(modifier > 40.0); // Should be faster with rubber
    }

    #[test]
    fn test_calculate_speed_modifier_with_malus() {
        let mut state = RubberState::new("p1");
        state.rubber = 1.0;
        state.malus = 0.3;
        
        let modifier = calculate_speed_modifier(&state, 40.0);
        assert!(modifier < 40.0); // Should be slower with malus
    }

    #[test]
    fn test_calculate_speed_modifier_minimum() {
        let mut state = RubberState::new("p1");
        state.malus = 10.0; // Extreme malus
        
        let modifier = calculate_speed_modifier(&state, 40.0);
        assert!(modifier >= 20.0); // Should not go below 50% of base
    }

    #[test]
    fn test_get_effective_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        state.malus = 0.5;
        
        let effective = get_effective_rubber(&state);
        assert_eq!(effective, 1.5);
    }

    #[test]
    fn test_get_effective_rubber_minimum() {
        let mut state = RubberState::new("p1");
        state.rubber = 0.5;
        state.malus = 1.0;
        
        let effective = get_effective_rubber(&state);
        assert_eq!(effective, RUBBER_CONFIG.min_rubber);
    }

    #[test]
    fn test_reset_rubber() {
        let mut state = RubberState::new("p1");
        state.rubber = 4.0;
        state.malus = 0.5;
        state.malus_timer = 2.0;
        
        reset_rubber(&mut state);
        
        assert_eq!(state.rubber, RUBBER_CONFIG.base_rubber);
        assert_eq!(state.malus, 0.0);
        assert_eq!(state.malus_timer, 0.0);
    }

    #[test]
    fn test_increase_rubber_for_position_first() {
        let mut state = RubberState::new("p1");
        let initial = state.rubber;
        
        increase_rubber_for_position(&mut state, 1, 6);
        
        assert!(state.rubber <= initial); // First place gets no increase
    }

    #[test]
    fn test_increase_rubber_for_position_last() {
        let mut state = RubberState::new("p1");
        let initial = state.rubber;
        
        increase_rubber_for_position(&mut state, 6, 6);
        
        assert!(state.rubber > initial); // Last place gets increase
    }

    #[test]
    fn test_increase_rubber_for_position_clamped() {
        let mut state = RubberState::with_rubber("p1", RUBBER_CONFIG.max_rubber);
        
        increase_rubber_for_position(&mut state, 6, 6);
        
        assert_eq!(state.rubber, RUBBER_CONFIG.max_rubber); // Should not exceed max
    }

    #[test]
    fn test_increase_rubber_zero_players() {
        let mut state = RubberState::new("p1");
        let initial = state.rubber;
        
        increase_rubber_for_position(&mut state, 1, 0);
        
        assert_eq!(state.rubber, initial); // No change with 0 players
    }

    #[test]
    fn test_rubber_config_constants() {
        assert_eq!(RUBBER_CONFIG.base_rubber, 1.0);
        assert_eq!(RUBBER_CONFIG.server_rubber, 3.0);
        assert_eq!(RUBBER_CONFIG.rubber_speed, 40.0);
        assert_eq!(RUBBER_CONFIG.min_distance, 0.001);
        assert_eq!(RUBBER_CONFIG.malus_duration, 0.5);
        assert_eq!(RUBBER_CONFIG.malus_factor, 0.3);
    }

    #[test]
    fn test_update_rubber_with_custom_config() {
        let mut state = RubberState::new("p1");
        state.rubber = 2.0;
        
        let custom_config = RubberConfig {
            decay_rate: 0.8,
            ..RubberConfig::default()
        };
        
        let new_rubber = update_rubber(&mut state, 1.0, Some(&custom_config));
        assert!(new_rubber < 2.0);
    }
}
