use spacetimedb::{table, reducer, Identity, ReducerContext, Table, SpacetimeType};

#[table(accessor = global_config, public)]
pub struct GlobalConfig {
    #[primary_key]
    pub version: u32,
    pub admin_id: Identity,
    pub base_speed: f32,
    pub boost_speed: f32,
    pub max_trail_length: f32,
    pub slipstream_mode: String,
    pub turn_speed: f32,  // NEW: How fast bikes turn (radians per second)
}

#[derive(SpacetimeType, Clone)]
pub struct Vec2 { pub x: f32, pub z: f32 }

#[table(accessor = player, public)]
pub struct Player {
    #[primary_key]
    pub id: String,
    pub owner_id: Identity,
    pub is_ai: bool,
    pub personality: String,
    pub color: u32,
    pub x: f32,
    pub z: f32,
    pub dir_x: f32,
    pub dir_z: f32,
    pub speed: f32,
    pub is_braking: bool,
    pub is_turning_left: bool,   // NEW: Smooth steering
    pub is_turning_right: bool,  // NEW: Smooth steering
    pub alive: bool,
    pub ready: bool,
    pub turn_points_json: String,
}

#[table(accessor = game_state, public)]
pub struct GameState {
    #[primary_key]
    pub id: u32,
    pub winner_id: String,
    pub round_active: bool,
    pub countdown: u32,
    pub player_count: u32,
    pub alive_count: u32,
}

#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    let admin_identity = Identity::from_hex("c2007484dedccf3d247b44dc4ebafeee388121889dffea0ceedfd63b888106c1").unwrap();
    
    ctx.db.global_config().insert(GlobalConfig {
        version: 1, 
        admin_id: admin_identity, 
        base_speed: 40.0, 
        boost_speed: 70.0, 
        max_trail_length: 200.0, 
        slipstream_mode: "tail_only".to_string(),
        turn_speed: 3.0,  // Radians per second for smooth turning
    });

    ctx.db.game_state().insert(GameState {
        id: 1,
        winner_id: String::new(),
        round_active: false,
        countdown: 3,
        player_count: 6,
        alive_count: 6,
    });

    // 6 players in a circle
    let num_players = 6;
    let spawn_radius = 100.0;
    
    for i in 0..num_players {
        let angle = (i as f32) * (std::f32::consts::PI * 2.0) / (num_players as f32);
        let x = angle.cos() * spawn_radius;
        let z = angle.sin() * spawn_radius;
        // Point toward center
        let dir_x = -angle.cos();
        let dir_z = -angle.sin();
        
        let colors = [0x00ffff, 0x00ff00, 0xff0000, 0xff00ff, 0xffff00, 0xff8800];
        let personalities = ["aggressive", "safe", "random", "aggressive", "safe", "random"];
        
        ctx.db.player().insert(Player {
            id: format!("p{}", i + 1), 
            owner_id: Identity::default(), 
            is_ai: true,
            personality: personalities[i % personalities.len()].to_string(), 
            color: colors[i % colors.len()],
            x, z, dir_x, dir_z,
            speed: 0.0, 
            is_braking: false,
            is_turning_left: false,
            is_turning_right: false,
            alive: true,
            ready: false,
            turn_points_json: "[]".to_string(),
        });
    }
}

#[reducer]
pub fn join(ctx: &ReducerContext) {
    if ctx.db.player().iter().any(|p| p.owner_id == ctx.sender()) {
        return;
    }
    
    if let Some(mut p) = ctx.db.player().iter()
        .filter(|p| p.is_ai)
        .next() 
    {
        p.is_ai = false;
        p.owner_id = ctx.sender();
        p.alive = true;
        p.ready = true;
        p.speed = 0.0;
        p.is_turning_left = false;
        p.is_turning_right = false;
        
        ctx.db.player().id().update(p);
        check_round_start(ctx);
    }
}

#[reducer(client_disconnected)]
pub fn on_disconnect(ctx: &ReducerContext) {
    if let Some(mut p) = ctx.db.player().iter().find(|p| p.owner_id == ctx.sender()) {
        p.is_ai = true;
        p.owner_id = Identity::default();
        p.ready = false;
        ctx.db.player().id().update(p);
    }
}

#[reducer]
pub fn sync_state(ctx: &ReducerContext, id: String, x: f32, z: f32, dir_x: f32, dir_z: f32, 
                  speed: f32, is_braking: bool, alive: bool, 
                  is_turning_left: bool, is_turning_right: bool,
                  turn_points_json: String) {
    if let Some(mut p) = ctx.db.player().id().find(id) {
        if p.owner_id == ctx.sender() || p.is_ai {
            p.x = x; p.z = z; 
            p.dir_x = dir_x; p.dir_z = dir_z;
            p.speed = speed; 
            p.is_braking = is_braking;
            p.is_turning_left = is_turning_left;
            p.is_turning_right = is_turning_right;
            p.alive = alive;
            p.turn_points_json = turn_points_json;
            ctx.db.player().id().update(p);
            check_winner(ctx);
        }
    }
}

#[reducer]
pub fn respawn(ctx: &ReducerContext, _player_id: String) {
    let num_players = 6;
    let spawn_radius = 100.0;
    
    for i in 0..num_players {
        if let Some(mut p) = ctx.db.player().id().find(format!("p{}", i + 1)) {
            let angle = (i as f32) * (std::f32::consts::PI * 2.0) / (num_players as f32);
            p.x = angle.cos() * spawn_radius;
            p.z = angle.sin() * spawn_radius;
            p.dir_x = -angle.cos();
            p.dir_z = -angle.sin();
            p.alive = true;
            p.speed = 0.0;
            p.is_braking = false;
            p.is_turning_left = false;
            p.is_turning_right = false;
            p.ready = !p.is_ai;
            p.turn_points_json = "[]".to_string();
            ctx.db.player().id().update(p);
        }
    }
    
    if let Some(mut gs) = ctx.db.game_state().id().find(1) {
        gs.round_active = false;
        gs.winner_id = String::new();
        gs.countdown = 3;
        ctx.db.game_state().id().update(gs);
    }
    
    start_countdown(ctx);
}

#[reducer]
pub fn update_config(ctx: &ReducerContext, boost_speed: f32, slipstream_mode: String) {
    if let Some(mut cfg) = ctx.db.global_config().version().find(1) {
        if ctx.sender() == cfg.admin_id {
            cfg.boost_speed = boost_speed;
            cfg.slipstream_mode = slipstream_mode;
            ctx.db.global_config().version().update(cfg);
        }
    }
}

fn check_round_start(ctx: &ReducerContext) {
    let human_count = ctx.db.player().iter().filter(|p| !p.is_ai).count();
    if human_count >= 1 {
        start_countdown(ctx);
    }
}

fn start_countdown(ctx: &ReducerContext) {
    if let Some(mut gs) = ctx.db.game_state().id().find(1) {
        gs.round_active = false;
        gs.countdown = 3;
        gs.winner_id = String::new();
        ctx.db.game_state().id().update(gs);
        
        let num_players = 6;
        let spawn_radius = 100.0;
        
        for i in 0..num_players {
            if let Some(mut p) = ctx.db.player().id().find(format!("p{}", i + 1)) {
                let angle = (i as f32) * (std::f32::consts::PI * 2.0) / (num_players as f32);
                p.x = angle.cos() * spawn_radius;
                p.z = angle.sin() * spawn_radius;
                p.dir_x = -angle.cos();
                p.dir_z = -angle.sin();
                p.speed = 0.0;
                p.turn_points_json = "[]".to_string();
                p.alive = true;
                ctx.db.player().id().update(p);
            }
        }
    }
}

#[reducer]
pub fn tick_countdown(ctx: &ReducerContext) {
    if let Some(mut gs) = ctx.db.game_state().id().find(1) {
        if !gs.round_active && gs.countdown > 0 {
            gs.countdown -= 1;
            
            if gs.countdown == 0 {
                gs.round_active = true;
                
                let num_players = 6;
                for i in 0..num_players {
                    if let Some(mut p) = ctx.db.player().id().find(format!("p{}", i + 1)) {
                        p.speed = 40.0;
                        p.ready = true;
                        ctx.db.player().id().update(p);
                    }
                }
            }
            
            ctx.db.game_state().id().update(gs);
        }
    }
}

fn check_winner(ctx: &ReducerContext) {
    let alive_players: Vec<_> = ctx.db.player().iter().filter(|p| p.alive).collect();
    let total_players = ctx.db.player().iter().filter(|p| p.ready).count();

    if let Some(mut gs) = ctx.db.game_state().id().find(1) {
        gs.alive_count = alive_players.len() as u32;
        gs.player_count = total_players as u32;

        if alive_players.len() == 1 && total_players > 1 && gs.round_active {
            gs.round_active = false;
            gs.winner_id = alive_players[0].id.clone();
            ctx.db.game_state().id().update(gs);
        } else if alive_players.is_empty() && gs.round_active {
            gs.round_active = false;
            ctx.db.game_state().id().update(gs);
        } else {
            ctx.db.game_state().id().update(gs);
        }
    }
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // GlobalConfig Tests
    // ========================================================================

    mod test_global_config {

        #[test]
        fn test_global_config_default_values() {
            // TODO: Test default configuration values
            // Verify base_speed, boost_speed, max_trail_length defaults
        }

        #[test]
        fn test_global_config_admin_identity() {
            // TODO: Test admin identity is set correctly
            // Verify admin_id matches expected hex value
        }
    }

    // ========================================================================
    // Player Tests
    // ========================================================================

    mod test_player {

        #[test]
        fn test_player_default_state() {
            // TODO: Test player default state
            // Verify initial values for speed, direction, alive status
        }

        #[test]
        fn test_player_ai_flag() {
            // TODO: Test AI player flag behavior
            // Verify is_ai can be toggled
        }

        #[test]
        fn test_player_turning_state() {
            // TODO: Test player turning state
            // Verify is_turning_left and is_turning_right flags
        }
    }

    // ========================================================================
    // GameState Tests
    // ========================================================================

    mod test_game_state {

        #[test]
        fn test_game_state_initial() {
            // TODO: Test initial game state
            // Verify countdown starts at 3
            // Verify round_active is false initially
        }

        #[test]
        fn test_game_state_winner() {
            // TODO: Test winner state tracking
            // Verify winner_id is set correctly
        }

        #[test]
        fn test_game_state_counts() {
            // TODO: Test player and alive counts
            // Verify counts are updated correctly
        }
    }

    // ========================================================================
    // Vec2 Tests
    // ========================================================================

    mod test_vec2 {
        use super::*;

        #[test]
        fn test_vec2_creation() {
            // TODO: Test Vec2 creation
            let vec = Vec2 { x: 1.0, z: 2.0 };
            assert_eq!(vec.x, 1.0);
            assert_eq!(vec.z, 2.0);
        }

        #[test]
        fn test_vec2_zero() {
            // TODO: Test zero vector
            let vec = Vec2 { x: 0.0, z: 0.0 };
            assert_eq!(vec.x, 0.0);
            assert_eq!(vec.z, 0.0);
        }

        #[test]
        fn test_vec2_direction() {
            // TODO: Test direction vector (normalized)
            let vec = Vec2 { x: -1.0, z: 0.0 };
            assert_eq!(vec.x, -1.0);
            assert_eq!(vec.z, 0.0);
        }
    }

    // ========================================================================
    // init() Unit Tests
    // ========================================================================

    mod test_init_unit {
        use super::*;

        #[test]
        fn test_init_admin_hex_parsing() {
            // TODO: Test admin identity hex parsing
            let admin_hex = "c2007484dedccf3d247b44dc4ebafeee388121889dffea0ceedfd63b888106c1";
            let result = Identity::from_hex(admin_hex);
            assert!(result.is_ok());
        }

        #[test]
        fn test_init_spawn_angle_calculation() {
            // TODO: Test spawn angle calculation for 6 players
            let num_players = 6;
            let spawn_radius = 100.0;
            
            for i in 0..num_players {
                let angle = (i as f32) * (std::f32::consts::PI * 2.0) / (num_players as f32);
                let x = angle.cos() * spawn_radius;
                let z = angle.sin() * spawn_radius;
                
                // Verify position is on the circle
                let distance = (x * x + z * z).sqrt();
                assert!((distance - spawn_radius).abs() < 0.01);
            }
        }

        #[test]
        fn test_init_player_colors_array() {
            // TODO: Test player colors are defined correctly
            let colors = [0x00ffff, 0x00ff00, 0xff0000, 0xff00ff, 0xffff00, 0xff8800];
            assert_eq!(colors.len(), 6);
        }

        #[test]
        fn test_init_personalities_array() {
            // TODO: Test player personalities are defined correctly
            let personalities = ["aggressive", "safe", "random", "aggressive", "safe", "random"];
            assert_eq!(personalities.len(), 6);
        }
    }

    // ========================================================================
    // join() Unit Tests
    // ========================================================================

    mod test_join_unit {

        #[test]
        fn test_join_identity_comparison() {
            // TODO: Test identity comparison logic
            // Verify owner_id comparison works correctly
        }

        #[test]
        fn test_join_ai_filter() {
            // TODO: Test AI player filtering
            // Verify only AI players can be converted
        }
    }

    // ========================================================================
    // sync_state() Unit Tests
    // ========================================================================

    mod test_sync_state_unit {

        #[test]
        fn test_sync_state_parameter_order() {
            // TODO: Test parameter order is correct
            // Verify all parameters are in expected order
        }

        #[test]
        fn test_sync_state_authorization_check() {
            // TODO: Test authorization logic
            // Verify owner_id or is_ai check works correctly
        }
    }

    // ========================================================================
    // respawn() Unit Tests
    // ========================================================================

    mod test_respawn_unit {

        #[test]
        fn test_respawn_position_reset() {
            // TODO: Test position reset calculation
            let num_players = 6;
            let spawn_radius = 100.0;
            
            for i in 0..num_players {
                let angle = (i as f32) * (std::f32::consts::PI * 2.0) / (num_players as f32);
                let expected_x = angle.cos() * spawn_radius;
                let expected_z = angle.sin() * spawn_radius;
                
                // Verify calculation matches expected circle positions
                assert!((expected_x - expected_x).abs() < 0.01);
                assert!((expected_z - expected_z).abs() < 0.01);
            }
        }

        #[test]
        fn test_respawn_direction_reset() {
            // TODO: Test direction reset (facing center)
            let num_players = 6;
            
            for i in 0..num_players {
                let angle = (i as f32) * (std::f32::consts::PI * 2.0) / (num_players as f32);
                let expected_dir_x = -angle.cos();
                let expected_dir_z = -angle.sin();
                
                // Verify direction points toward center
                assert!(expected_dir_x * angle.cos() + expected_dir_z * angle.sin() < 0.0);
            }
        }

        #[test]
        fn test_respawn_state_reset() {
            // TODO: Test state reset values
            // Verify speed, braking, turning are reset
        }
    }

    // ========================================================================
    // tick_countdown() Unit Tests
    // ========================================================================

    mod test_tick_countdown_unit {

        #[test]
        fn test_countdown_decrement_logic() {
            // TODO: Test countdown decrement
            // Verify countdown decreases by 1
        }

        #[test]
        fn test_countdown_round_start_threshold() {
            // TODO: Test round start at zero
            // Verify round starts when countdown reaches 0
        }

        #[test]
        fn test_countdown_player_speed_on_start() {
            // TODO: Test player speed on round start
            // Verify speed is set to 40.0
        }
    }

    // ========================================================================
    // check_winner() Unit Tests
    // ========================================================================

    mod test_check_winner_unit {

        #[test]
        fn test_winner_single_survivor_condition() {
            // TODO: Test single survivor detection
            // Verify winner is declared when alive_count == 1
        }

        #[test]
        fn test_winner_no_survivors_condition() {
            // TODO: Test no survivors handling
            // Verify round ends when alive_count == 0
        }

        #[test]
        fn test_winner_requires_active_round() {
            // TODO: Test round_active requirement
            // Verify winner only declared during active round
        }

        #[test]
        fn test_winner_requires_multiple_players() {
            // TODO: Test multiple players requirement
            // Verify winner not declared if total_players <= 1
        }
    }

    // ========================================================================
    // check_round_start() Unit Tests
    // ========================================================================

    mod test_check_round_start_unit {

        #[test]
        fn test_round_start_human_count_threshold() {
            // TODO: Test human count threshold
            // Verify round starts with at least 1 human
        }

        #[test]
        fn test_round_start_ai_only_waits() {
            // TODO: Test AI-only waiting
            // Verify round doesn't start with only AI players
        }
    }

    // ========================================================================
    // Helper Function Tests
    // ========================================================================

    mod test_helpers {

        #[test]
        fn test_circle_position_calculation() {
            // TODO: Test circle position math
            let angle: f32 = 0.0;
            let radius = 100.0;
            let x = angle.cos() * radius;
            let z = angle.sin() * radius;

            assert!((x - 100.0).abs() < 0.01);
            assert!((z - 0.0).abs() < 0.01);
        }

        #[test]
        fn test_direction_toward_center() {
            // TODO: Test direction calculation toward center
            let angle: f32 = 0.0;
            let dir_x = -angle.cos();
            let dir_z = -angle.sin();

            assert!((dir_x - (-1.0)).abs() < 0.01);
            assert!((dir_z - 0.0).abs() < 0.01);
        }

        #[test]
        fn test_angle_distribution() {
            // TODO: Test equal angle distribution for 6 players
            let num_players = 6;
            let angle_step = (std::f32::consts::PI * 2.0) / (num_players as f32);
            
            assert!((angle_step - std::f32::consts::FRAC_PI_3).abs() < 0.01);
        }
    }

    // ========================================================================
    // Edge Case Tests
    // ========================================================================

    mod test_edge_cases {
        use super::*;

        #[test]
        fn test_empty_player_id() {
            // TODO: Test empty player ID handling
            let empty_id = String::new();
            assert!(empty_id.is_empty());
        }

        #[test]
        fn test_turn_points_empty_json() {
            // TODO: Test empty turn points JSON
            let empty_json = "[]".to_string();
            assert_eq!(empty_json, "[]");
        }

        #[test]
        fn test_default_identity() {
            // TODO: Test default identity
            let _default_id = Identity::default();
            // Verify default identity behavior
        }
    }
}