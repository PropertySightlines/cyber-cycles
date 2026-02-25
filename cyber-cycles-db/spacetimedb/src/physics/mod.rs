//! Physics module for Cyber Cycles server-side validation
//!
//! This module provides server-authoritative physics calculations including:
//! - Rubber banding system for catch-up mechanics
//! - Collision detection with trails and arena bounds
//! - Configuration for physics parameters

pub mod rubber;
pub mod collision;
pub mod config;

// Re-export commonly used types
pub use rubber::{RubberState, RUBBER_CONFIG};
pub use collision::{EPS, CollisionType};
pub use config::{PhysicsConfig, CollisionConfig, RubberConfig};

/// Physics validation result type
pub type PhysicsResult<T> = Result<T, PhysicsError>;

/// Errors that can occur during physics validation
#[derive(Debug, Clone, PartialEq)]
pub enum PhysicsError {
    /// Rubber value mismatch beyond tolerance
    RubberMismatch {
        client_value: f32,
        server_value: f32,
        tolerance: f32,
    },
    /// Collision detected
    Collision {
        player_id: String,
        collision_type: CollisionType,
    },
    /// Out of arena bounds
    OutOfBounds {
        x: f32,
        z: f32,
        arena_size: f32,
    },
    /// Invalid configuration
    InvalidConfig(String),
    /// Invalid state
    InvalidState(String),
}

impl std::fmt::Display for PhysicsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PhysicsError::RubberMismatch { client_value, server_value, tolerance } => {
                write!(f, "Rubber mismatch: client={}, server={}, tolerance={}", 
                       client_value, server_value, tolerance)
            }
            PhysicsError::Collision { player_id, collision_type } => {
                write!(f, "Collision detected for {}: {:?}", player_id, collision_type)
            }
            PhysicsError::OutOfBounds { x, z, arena_size } => {
                write!(f, "Out of bounds: ({}, {}) outside arena size {}", x, z, arena_size)
            }
            PhysicsError::InvalidConfig(msg) => write!(f, "Invalid config: {}", msg),
            PhysicsError::InvalidState(msg) => write!(f, "Invalid state: {}", msg),
        }
    }
}

/// Validates physics state and returns any errors
pub fn validate_physics_state(
    _player_id: &str,
    x: f32,
    z: f32,
    arena_size: f32,
) -> PhysicsResult<()> {
    // Check arena bounds
    collision::check_arena_bounds(x, z, arena_size)
        .map_err(|_| PhysicsError::OutOfBounds { x, z, arena_size })?;
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_physics_error_display() {
        let err = PhysicsError::RubberMismatch {
            client_value: 1.5,
            server_value: 2.0,
            tolerance: 0.1,
        };
        assert!(err.to_string().contains("Rubber mismatch"));
    }

    #[test]
    fn test_collision_type_display() {
        let collision = CollisionType::SelfTrail;
        assert_eq!(format!("{:?}", collision), "SelfTrail");
    }

    #[test]
    fn test_validate_physics_state_valid() {
        let result = validate_physics_state("p1", 50.0, 50.0, 200.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_physics_state_out_of_bounds() {
        let result = validate_physics_state("p1", 250.0, 250.0, 200.0);
        assert!(result.is_err());
    }
}
