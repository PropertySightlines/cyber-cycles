//! Collision detection system for Cyber Cycles
//!
//! This module provides collision detection for:
//! - Trail segments (player's own and others)
//! - Arena boundaries
//! - Continuous collision checking for fast-moving objects

use crate::physics::config::CollisionConfig;

/// Epsilon constant for floating-point comparisons
pub const EPS: f32 = 0.01;

/// Default collision configuration
pub const COLLISION_CONFIG: CollisionConfig = CollisionConfig {
    death_radius: 2.0,
    bike_collision_dist: 3.0,
    trail_collision_dist: 2.5,
    wall_collision_dist: 1.0,
    slipstream_distance: 5.0,
    slipstream_angle: 0.3,
};

/// A line segment in 2D space (XZ plane)
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Segment {
    pub start_x: f32,
    pub start_z: f32,
    pub end_x: f32,
    pub end_z: f32,
}

impl Segment {
    /// Create a new segment from two points
    pub fn new(start_x: f32, start_z: f32, end_x: f32, end_z: f32) -> Self {
        Self { start_x, start_z, end_x, end_z }
    }

    /// Create a segment from a player's current and previous position
    pub fn from_positions(prev_x: f32, prev_z: f32, curr_x: f32, curr_z: f32) -> Self {
        Self {
            start_x: prev_x,
            start_z: prev_z,
            end_x: curr_x,
            end_z: curr_z,
        }
    }

    /// Get the length of the segment
    pub fn length(&self) -> f32 {
        let dx = self.end_x - self.start_x;
        let dz = self.end_z - self.start_z;
        (dx * dx + dz * dz).sqrt()
    }
}

/// Player state for collision detection
#[derive(Debug, Clone, PartialEq)]
pub struct PlayerState {
    pub id: String,
    pub x: f32,
    pub z: f32,
    pub dir_x: f32,
    pub dir_z: f32,
    pub alive: bool,
}

impl PlayerState {
    /// Create a new player state
    pub fn new(
        id: String,
        x: f32,
        z: f32,
        dir_x: f32,
        dir_z: f32,
        alive: bool,
    ) -> Self {
        Self { id, x, z, dir_x, dir_z, alive }
    }
}

/// Result of a collision check
#[derive(Debug, Clone, PartialEq)]
pub struct CollisionResult {
    pub collided: bool,
    pub collision_type: Option<CollisionType>,
    pub distance: f32,
    pub segment_index: Option<usize>,
}

impl Default for CollisionResult {
    fn default() -> Self {
        Self {
            collided: false,
            collision_type: None,
            distance: f32::MAX,
            segment_index: None,
        }
    }
}

/// Type of collision detected
#[derive(Debug, Clone, PartialEq)]
pub enum CollisionType {
    /// Collision with own trail
    SelfTrail,
    /// Collision with another player's trail
    OtherTrail(String),
    /// Collision with arena wall
    Wall,
}

/// Calculates the squared distance from a point to a line segment
///
/// This is a helper function that avoids the expensive sqrt operation
/// when only comparing distances.
///
/// # Arguments
/// * `px`, `pz` - Point to check
/// * `sx`, `sz` - Segment start point
/// * `ex`, `ez` - Segment end point
///
/// # Returns
/// Squared distance from point to segment
pub fn distance_to_segment_squared(
    px: f32, pz: f32,
    sx: f32, sz: f32,
    ex: f32, ez: f32,
) -> f32 {
    let dx = ex - sx;
    let dz = ez - sz;
    
    // Handle degenerate segment (single point)
    let segment_len_sq = dx * dx + dz * dz;
    if segment_len_sq < EPS * EPS {
        let pdx = px - sx;
        let pdz = pz - sz;
        return pdx * pdx + pdz * pdz;
    }
    
    // Project point onto line, clamped to segment
    let mut t = ((px - sx) * dx + (pz - sz) * dz) / segment_len_sq;
    t = t.max(0.0).min(1.0);
    
    // Find closest point on segment
    let closest_x = sx + t * dx;
    let closest_z = sz + t * dz;
    
    // Return squared distance
    let pdx = px - closest_x;
    let pdz = pz - closest_z;
    pdx * pdx + pdz * pdz
}

/// Calculates the distance from a point to a line segment
///
/// # Arguments
/// * `px`, `pz` - Point to check
/// * `sx`, `sz` - Segment start point
/// * `ex`, `ez` - Segment end point
///
/// # Returns
/// Distance from point to segment
pub fn distance_to_segment(
    px: f32, pz: f32,
    sx: f32, sz: f32,
    ex: f32, ez: f32,
) -> f32 {
    distance_to_segment_squared(px, pz, sx, sz, ex, ez).sqrt()
}

/// Calculates distance from a point to a segment struct
///
/// # Arguments
/// * `px`, `pz` - Point to check
/// * `segment` - Line segment
///
/// # Returns
/// Distance from point to segment
pub fn distance_to_segment_struct(px: f32, pz: f32, segment: &Segment) -> f32 {
    distance_to_segment(px, pz, segment.start_x, segment.start_z, segment.end_x, segment.end_z)
}

/// Checks for collision between a player and trail segments
///
/// # Arguments
/// * `player` - Player state to check
/// * `segments` - Slice of trail segments to check against
/// * `death_radius` - Distance threshold for collision
///
/// # Returns
/// CollisionResult with collision details
pub fn check_trail_collision(
    player: &PlayerState,
    segments: &[Segment],
    death_radius: f32,
) -> CollisionResult {
    if !player.alive {
        return CollisionResult::default();
    }
    
    let death_radius_sq = death_radius * death_radius;
    let mut result = CollisionResult::default();
    
    for (index, segment) in segments.iter().enumerate() {
        let dist_sq = distance_to_segment_squared(
            player.x, player.z,
            segment.start_x, segment.start_z,
            segment.end_x, segment.end_z,
        );
        
        if dist_sq < death_radius_sq {
            result.collided = true;
            result.distance = dist_sq.sqrt();
            result.segment_index = Some(index);
            return result;
        }
        
        // Track minimum distance
        let dist = dist_sq.sqrt();
        if dist < result.distance {
            result.distance = dist;
            result.segment_index = Some(index);
        }
    }
    
    result
}

/// Checks for collision with a specific player's trail
///
/// # Arguments
/// * `player` - Player state to check
/// * `trail_owner_id` - ID of the trail owner
/// * `segments` - Trail segments
/// * `death_radius` - Collision threshold
///
/// # Returns
/// CollisionResult with collision details and type
pub fn check_trail_collision_with_owner(
    player: &PlayerState,
    trail_owner_id: &str,
    segments: &[Segment],
    death_radius: f32,
) -> CollisionResult {
    let mut result = check_trail_collision(player, segments, death_radius);
    
    if result.collided {
        if player.id == trail_owner_id {
            result.collision_type = Some(CollisionType::SelfTrail);
        } else {
            result.collision_type = Some(CollisionType::OtherTrail(trail_owner_id.to_string()));
        }
    }
    
    result
}

/// Performs continuous collision check for fast-moving objects
///
/// This checks the entire path from previous to current position
/// against trail segments, preventing tunneling through thin obstacles.
///
/// # Arguments
/// * `prev_x`, `prev_z` - Previous position
/// * `curr_x`, `curr_z` - Current position
/// * `segments` - Trail segments to check
///
/// # Returns
/// CollisionResult indicating if collision occurred along the path
pub fn continuous_collision_check(
    prev_x: f32, prev_z: f32,
    curr_x: f32, curr_z: f32,
    segments: &[Segment],
) -> CollisionResult {
    let mut result = CollisionResult::default();
    
    // Create a segment from the player's movement
    let movement_segment = Segment::from_positions(prev_x, prev_z, curr_x, curr_z);
    
    for (index, segment) in segments.iter().enumerate() {
        if segments_intersect(&movement_segment, segment) {
            result.collided = true;
            result.segment_index = Some(index);
            result.collision_type = Some(CollisionType::OtherTrail(String::new()));
            return result;
        }
    }
    
    result
}

/// Checks if two line segments intersect
///
/// Uses the cross product method to determine intersection.
///
/// # Arguments
/// * `s1` - First segment
/// * `s2` - Second segment
///
/// # Returns
/// True if segments intersect
pub fn segments_intersect(s1: &Segment, s2: &Segment) -> bool {
    let d1 = direction(s2, &s1.start());
    let d2 = direction(s2, &s1.end());
    let d3 = direction(s1, &s2.start());
    let d4 = direction(s1, &s2.end());
    
    // General case: segments straddle each other
    if ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS))
        && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))
    {
        return true;
    }
    
    // Special cases: endpoints lie on the other segment
    if d1.abs() < EPS && on_segment(s2, &s1.start()) { return true; }
    if d2.abs() < EPS && on_segment(s2, &s1.end()) { return true; }
    if d3.abs() < EPS && on_segment(s1, &s2.start()) { return true; }
    if d4.abs() < EPS && on_segment(s1, &s2.end()) { return true; }
    
    false
}

/// Calculates the direction/cross product of three points
///
/// # Arguments
/// * `s` - Segment to use as reference
/// * `p` - Point to check (as (x, z) tuple)
///
/// # Returns
/// Cross product value (positive = left, negative = right, zero = collinear)
fn direction(s: &Segment, p: &(f32, f32)) -> f32 {
    let (px, pz) = p;
    let dx1 = px - s.start_x;
    let dz1 = pz - s.start_z;
    let dx2 = s.end_x - s.start_x;
    let dz2 = s.end_z - s.start_z;
    
    dx1 * dz2 - dz1 * dx2
}

/// Checks if a point lies on a segment (assumes collinearity)
///
/// # Arguments
/// * `s` - Segment
/// * `p` - Point to check (as (x, z) tuple)
///
/// # Returns
/// True if point is on the segment
fn on_segment(s: &Segment, p: &(f32, f32)) -> bool {
    let px = p.0;
    let pz = p.1;
    let min_x = s.start_x.min(s.end_x) - EPS;
    let max_x = s.start_x.max(s.end_x) + EPS;
    let min_z = s.start_z.min(s.end_z) - EPS;
    let max_z = s.start_z.max(s.end_z) + EPS;
    
    (px >= min_x && px <= max_x) && (pz >= min_z && pz <= max_z)
}

impl Segment {
    /// Get the start point as a tuple
    pub fn start(&self) -> (f32, f32) {
        (self.start_x, self.start_z)
    }
    
    /// Get the end point as a tuple
    pub fn end(&self) -> (f32, f32) {
        (self.end_x, self.end_z)
    }
}

/// Checks if a position is within arena bounds
///
/// # Arguments
/// * `x`, `z` - Position to check
/// * `arena_size` - Half-size of the arena (arena extends from -size to +size)
///
/// # Returns
/// * `Ok(())` if within bounds
/// * `Err` with position details if out of bounds
pub fn check_arena_bounds(
    x: f32, z: f32, arena_size: f32,
) -> Result<(), crate::physics::PhysicsError> {
    let bound = arena_size - COLLISION_CONFIG.wall_collision_dist;
    
    if x.abs() > bound || z.abs() > bound {
        Err(crate::physics::PhysicsError::OutOfBounds { x, z, arena_size })
    } else {
        Ok(())
    }
}

/// Checks for collision with arena walls
///
/// # Arguments
/// * `x`, `z` - Position to check
/// * `arena_size` - Half-size of the arena
/// * `wall_distance` - Distance from edge to consider as collision
///
/// # Returns
/// True if colliding with wall
pub fn check_wall_collision(
    x: f32, z: f32, arena_size: f32, wall_distance: f32,
) -> bool {
    let bound = arena_size - wall_distance;
    x.abs() >= bound || z.abs() >= bound
}

/// Checks for slipstream effect from another player
///
/// # Arguments
/// * `player` - Player to check slipstream for
/// * `leader` - Potential slipstream leader
/// * `slipstream_distance` - Maximum distance for slipstream
/// * `slipstream_angle` - Maximum angle for slipstream (radians)
///
/// # Returns
/// True if player is in slipstream of leader
pub fn check_slipstream(
    player: &PlayerState,
    leader: &PlayerState,
    slipstream_distance: f32,
    slipstream_angle: f32,
) -> bool {
    // Vector from player to leader
    let dx = leader.x - player.x;
    let dz = leader.z - player.z;
    let dist_sq = dx * dx + dz * dz;
    
    // Check distance
    if dist_sq > slipstream_distance * slipstream_distance {
        return false;
    }
    
    // Check angle (player should be facing toward leader)
    let dist = dist_sq.sqrt();
    if dist < EPS {
        return false;
    }
    
    // Normalize direction to leader
    let to_leader_x = dx / dist;
    let to_leader_z = dz / dist;
    
    // Dot product with player direction
    let dot = player.dir_x * to_leader_x + player.dir_z * to_leader_z;
    
    // Check if angle is within slipstream cone
    dot > slipstream_angle.cos()
}

/// Finds the closest segment to a point
///
/// # Arguments
/// * `px`, `pz` - Point to check
/// * `segments` - Segments to search
///
/// # Returns
/// Tuple of (segment_index, distance) or None if no segments
pub fn find_closest_segment(
    px: f32, pz: f32,
    segments: &[Segment],
) -> Option<(usize, f32)> {
    if segments.is_empty() {
        return None;
    }
    
    let mut closest_idx = 0;
    let mut closest_dist = f32::MAX;
    
    for (idx, segment) in segments.iter().enumerate() {
        let dist = distance_to_segment_struct(px, pz, segment);
        if dist < closest_dist {
            closest_dist = dist;
            closest_idx = idx;
        }
    }
    
    Some((closest_idx, closest_dist))
}

/// Gets all segments within a certain distance of a point
///
/// # Arguments
/// * `px`, `pz` - Point to check
/// * `segments` - Segments to search
/// * `max_distance` - Maximum distance threshold
///
/// # Returns
/// Vector of (segment_index, distance) tuples
pub fn find_segments_within_distance(
    px: f32, pz: f32,
    segments: &[Segment],
    max_distance: f32,
) -> Vec<(usize, f32)> {
    let max_dist_sq = max_distance * max_distance;
    let mut results = Vec::new();
    
    for (idx, segment) in segments.iter().enumerate() {
        let dist_sq = distance_to_segment_squared(
            px, pz,
            segment.start_x, segment.start_z,
            segment.end_x, segment.end_z,
        );
        
        if dist_sq <= max_dist_sq {
            results.push((idx, dist_sq.sqrt()));
        }
    }
    
    results
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eps_constant() {
        assert_eq!(EPS, 0.01);
    }

    #[test]
    fn test_segment_new() {
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
    fn test_segment_length() {
        let seg = Segment::new(0.0, 0.0, 3.0, 4.0);
        assert!((seg.length() - 5.0).abs() < EPS);
    }

    #[test]
    fn test_segment_length_zero() {
        let seg = Segment::new(1.0, 1.0, 1.0, 1.0);
        assert!((seg.length() - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_point_on_start() {
        let dist = distance_to_segment(0.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_point_on_end() {
        let dist = distance_to_segment(10.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_point_on_line() {
        let dist = distance_to_segment(5.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 0.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_perpendicular() {
        let dist = distance_to_segment(5.0, 3.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 3.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_beyond_start() {
        let dist = distance_to_segment(-5.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 5.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_beyond_end() {
        let dist = distance_to_segment(15.0, 0.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist - 5.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_degenerate() {
        let dist = distance_to_segment(3.0, 4.0, 0.0, 0.0, 0.0, 0.0);
        assert!((dist - 5.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_squared() {
        let dist_sq = distance_to_segment_squared(3.0, 4.0, 0.0, 0.0, 10.0, 0.0);
        assert!((dist_sq - 16.0).abs() < EPS);
    }

    #[test]
    fn test_distance_to_segment_struct() {
        let seg = Segment::new(0.0, 0.0, 10.0, 0.0);
        let dist = distance_to_segment_struct(5.0, 3.0, &seg);
        assert!((dist - 3.0).abs() < EPS);
    }

    #[test]
    fn test_player_state_new() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 1.0, 0.0, true);
        assert_eq!(player.id, "p1");
        assert_eq!(player.x, 0.0);
        assert_eq!(player.z, 0.0);
        assert_eq!(player.dir_x, 1.0);
        assert_eq!(player.dir_z, 0.0);
        assert!(player.alive);
    }

    #[test]
    fn test_collision_result_default() {
        let result = CollisionResult::default();
        assert!(!result.collided);
        assert!(result.collision_type.is_none());
        assert_eq!(result.distance, f32::MAX);
        assert!(result.segment_index.is_none());
    }

    #[test]
    fn test_check_trail_collision_no_collision() {
        let player = PlayerState::new("p1".to_string(), 0.0, 10.0, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = check_trail_collision(&player, &segments, 2.0);
        assert!(!result.collided);
    }

    #[test]
    fn test_check_trail_collision_hit() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = check_trail_collision(&player, &segments, 2.0);
        assert!(result.collided);
        assert_eq!(result.segment_index, Some(0));
    }

    #[test]
    fn test_check_trail_collision_dead_player() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.0, 0.0, 1.0, false);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = check_trail_collision(&player, &segments, 2.0);
        assert!(!result.collided);
    }

    #[test]
    fn test_check_trail_collision_with_owner_self() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = check_trail_collision_with_owner(&player, "p1", &segments, 2.0);
        assert!(result.collided);
        assert_eq!(result.collision_type, Some(CollisionType::SelfTrail));
    }

    #[test]
    fn test_check_trail_collision_with_owner_other() {
        let player = PlayerState::new("p1".to_string(), 5.0, 0.5, 0.0, 1.0, true);
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        let result = check_trail_collision_with_owner(&player, "p2", &segments, 2.0);
        assert!(result.collided);
        assert_eq!(result.collision_type, Some(CollisionType::OtherTrail("p2".to_string())));
    }

    #[test]
    fn test_continuous_collision_check_intersect() {
        let segments = [Segment::new(0.0, 0.0, 10.0, 10.0)];
        
        // Movement crosses the segment
        let result = continuous_collision_check(0.0, 10.0, 10.0, 0.0, &segments);
        assert!(result.collided);
    }

    #[test]
    fn test_continuous_collision_check_no_intersect() {
        let segments = [Segment::new(0.0, 0.0, 10.0, 0.0)];
        
        // Movement parallel and away from segment
        let result = continuous_collision_check(0.0, 5.0, 10.0, 5.0, &segments);
        assert!(!result.collided);
    }

    #[test]
    fn test_segments_intersect_cross() {
        let s1 = Segment::new(0.0, 0.0, 10.0, 10.0);
        let s2 = Segment::new(0.0, 10.0, 10.0, 0.0);
        
        assert!(segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_segments_intersect_parallel() {
        let s1 = Segment::new(0.0, 0.0, 10.0, 0.0);
        let s2 = Segment::new(0.0, 1.0, 10.0, 1.0);
        
        assert!(!segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_segments_intersect_touch_endpoints() {
        let s1 = Segment::new(0.0, 0.0, 5.0, 5.0);
        let s2 = Segment::new(5.0, 5.0, 10.0, 0.0);
        
        assert!(segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_segments_intersect_collinear_overlap() {
        let s1 = Segment::new(0.0, 0.0, 10.0, 0.0);
        let s2 = Segment::new(5.0, 0.0, 15.0, 0.0);
        
        assert!(segments_intersect(&s1, &s2));
    }

    #[test]
    fn test_check_arena_bounds_inside() {
        let result = check_arena_bounds(50.0, 50.0, 100.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_arena_bounds_outside() {
        let result = check_arena_bounds(150.0, 50.0, 100.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_check_arena_bounds_edge() {
        let result = check_arena_bounds(99.0, 50.0, 100.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_wall_collision_safe() {
        assert!(!check_wall_collision(50.0, 50.0, 100.0, 5.0));
    }

    #[test]
    fn test_check_wall_collision_hit() {
        assert!(check_wall_collision(98.0, 50.0, 100.0, 5.0));
    }

    #[test]
    fn test_check_slipstream_behind() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 0.0, 1.0, true);
        let leader = PlayerState::new("p2".to_string(), 0.0, 3.0, 0.0, 1.0, true);
        
        assert!(check_slipstream(&player, &leader, 5.0, 0.3));
    }

    #[test]
    fn test_check_slipstream_too_far() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 0.0, 1.0, true);
        let leader = PlayerState::new("p2".to_string(), 0.0, 10.0, 0.0, 1.0, true);
        
        assert!(!check_slipstream(&player, &leader, 5.0, 0.3));
    }

    #[test]
    fn test_check_slipstream_wrong_angle() {
        let player = PlayerState::new("p1".to_string(), 0.0, 0.0, 1.0, 0.0, true);
        let leader = PlayerState::new("p2".to_string(), 0.0, 3.0, 0.0, 1.0, true);
        
        assert!(!check_slipstream(&player, &leader, 5.0, 0.3));
    }

    #[test]
    fn test_find_closest_segment() {
        let segments = [
            Segment::new(0.0, 0.0, 10.0, 0.0),
            Segment::new(0.0, 10.0, 10.0, 10.0),
        ];
        
        let result = find_closest_segment(5.0, 1.0, &segments);
        assert_eq!(result.unwrap().0, 0);
    }

    #[test]
    fn test_find_closest_segment_empty() {
        let segments: [Segment; 0] = [];
        assert!(find_closest_segment(0.0, 0.0, &segments).is_none());
    }

    #[test]
    fn test_find_segments_within_distance() {
        let segments = [
            Segment::new(0.0, 0.0, 10.0, 0.0),
            Segment::new(0.0, 10.0, 10.0, 10.0),
        ];
        
        let results = find_segments_within_distance(5.0, 1.0, &segments, 3.0);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].0, 0);
    }

    #[test]
    fn test_collision_config_constants() {
        assert_eq!(COLLISION_CONFIG.death_radius, 2.0);
        assert_eq!(COLLISION_CONFIG.bike_collision_dist, 3.0);
        assert_eq!(COLLISION_CONFIG.trail_collision_dist, 2.5);
    }

    #[test]
    fn test_collision_type_debug() {
        let self_trail = CollisionType::SelfTrail;
        assert_eq!(format!("{:?}", self_trail), "SelfTrail");
        
        let other = CollisionType::OtherTrail("p2".to_string());
        assert!(format!("{:?}", other).contains("p2"));
        
        let wall = CollisionType::Wall;
        assert_eq!(format!("{:?}", wall), "Wall");
    }
}
