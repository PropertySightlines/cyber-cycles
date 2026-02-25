/**
 * GameLoop Usage Example for Cyber Cycles
 *
 * This file demonstrates how to use the GameLoop class for
 * fixed timestep physics and variable rendering in Cyber Cycles.
 *
 * Features demonstrated:
 * - Basic setup and configuration
 * - Physics and render callbacks
 * - Interpolation for smooth rendering
 * - Event handling
 * - Statistics tracking
 * - Pause/resume functionality
 * - Error handling
 */

import { GameLoop, createGameLoop } from '../src/core/GameLoop.js';

// ============================================================================
// Example 1: Basic Setup
// ============================================================================

/**
 * Basic game loop setup with default options
 */
function basicExample() {
    console.log('=== Basic Example ===');

    // Create game loop with default options (1/60s fixed timestep)
    const loop = new GameLoop();

    // Set physics callback - receives fixed timestep in seconds
    loop.setPhysicsCallback((fixedDt) => {
        // Update game physics at fixed timestep
        console.log(`Physics update: dt = ${(fixedDt * 1000).toFixed(2)}ms`);
        // Example: updatePlayerPhysics(fixedDt);
        // Example: updateCollisions(fixedDt);
    });

    // Set render callback - receives interpolation alpha (0.0 - 1.0)
    loop.setRenderCallback((alpha) => {
        // Render with interpolation for smooth visuals
        console.log(`Render: alpha = ${alpha.toFixed(3)}`);
        // Example: interpolateEntities(alpha);
        // Example: renderer.render();
    });

    // Start the loop
    loop.start();
    console.log('Game loop started');

    // Stop after 5 seconds (for demo purposes)
    setTimeout(() => {
        loop.stop();
        console.log('Game loop stopped');
    }, 5000);
}

// ============================================================================
// Example 2: Custom Configuration
// ============================================================================

/**
 * Game loop with custom configuration options
 */
function customConfigExample() {
    console.log('\n=== Custom Configuration Example ===');

    // Create game loop with custom options
    const loop = new GameLoop({
        fixedDt: 1 / 60,        // 60 Hz physics (16.67ms)
        maxFrameTime: 250,       // Cap frame time at 250ms
        debug: true              // Enable debug logging
    });

    // Enable debug mode for verbose logging
    loop.enableDebug();

    loop.setPhysicsCallback((dt) => {
        // Physics at 60 Hz
    });

    loop.setRenderCallback((alpha) => {
        // Render with interpolation
    });

    loop.start();

    setTimeout(() => {
        loop.stop();
    }, 3000);
}

// ============================================================================
// Example 3: Event Handling
// ============================================================================

/**
 * Using event handlers for lifecycle events
 */
function eventHandlingExample() {
    console.log('\n=== Event Handling Example ===');

    const loop = new GameLoop();

    // Register event handlers using method chaining
    loop
        .onStart(() => {
            console.log('Game loop started!');
        })
        .onStop(() => {
            console.log('Game loop stopped!');
        })
        .onPause(() => {
            console.log('Game loop paused!');
        })
        .onResume(() => {
            console.log('Game loop resumed!');
        })
        .onFrame((frameData) => {
            // Called every frame with statistics
            if (frameData.totalFrames % 60 === 0) {
                console.log(`Frame ${frameData.totalFrames}: FPS = ${frameData.fps.toFixed(1)}`);
            }
        })
        .onError((errorData) => {
            console.error(`Error in ${errorData.source}: ${errorData.message}`);
        });

    loop.setPhysicsCallback((dt) => {
        // Simulate occasional error
        if (Math.random() < 0.001) {
            throw new Error('Random physics error');
        }
    });

    loop.setRenderCallback((alpha) => {
        // Render
    });

    loop.start();

    // Pause after 2 seconds
    setTimeout(() => {
        loop.pause();
    }, 2000);

    // Resume after 1 second
    setTimeout(() => {
        loop.resume();
    }, 3000);

    // Stop after 5 seconds
    setTimeout(() => {
        loop.stop();
    }, 5000);
}

// ============================================================================
// Example 4: Statistics Tracking
// ============================================================================

/**
 * Monitoring game loop statistics
 */
function statisticsExample() {
    console.log('\n=== Statistics Example ===');

    const loop = new GameLoop({ debug: false });

    loop.setPhysicsCallback((dt) => {
        // Physics update
    });

    loop.setRenderCallback((alpha) => {
        // Render
    });

    // Log statistics every second
    const statsInterval = setInterval(() => {
        const stats = loop.getStats();
        console.log(`Stats: FPS=${stats.fps.toFixed(1)}, FrameTime=${stats.frameTime.toFixed(2)}ms, PhysicsUpdates=${stats.physicsUpdatesPerFrame}`);
    }, 1000);

    loop.start();

    // Stop after 5 seconds and show final stats
    setTimeout(() => {
        loop.stop();
        clearInterval(statsInterval);

        const finalStats = loop.getStats();
        console.log('\nFinal Statistics:');
        console.log(`  Total Frames: ${finalStats.totalFrames}`);
        console.log(`  Total Physics Updates: ${finalStats.totalPhysicsUpdates}`);
        console.log(`  Average FPS: ${finalStats.averageFps.toFixed(2)}`);
        console.log(`  Average Frame Time: ${finalStats.averageFrameTime.toFixed(2)}ms`);

        // Show frame history
        const history = loop.getFrameHistory(10);
        console.log(`  Last 10 Frame Times: ${history.map(t => t.toFixed(2) + 'ms').join(', ')}`);
    }, 5000);
}

// ============================================================================
// Example 5: Interpolation for Smooth Rendering
// ============================================================================

/**
 * Using interpolation alpha for smooth entity rendering
 */
function interpolationExample() {
    console.log('\n=== Interpolation Example ===');

    // Simulated entity with position
    const entity = {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vx: 100, // units per second
        vy: 50
    };

    const loop = new GameLoop({ fixedDt: 1 / 60 });

    loop.setPhysicsCallback((dt) => {
        // Store previous position for interpolation
        entity.prevX = entity.x;
        entity.prevY = entity.y;

        // Update position at fixed timestep
        entity.x += entity.vx * dt;
        entity.y += entity.vy * dt;

        console.log(`Physics: position = (${entity.x.toFixed(2)}, ${entity.y.toFixed(2)})`);
    });

    loop.setRenderCallback((alpha) => {
        // Interpolate between previous and current position
        const renderX = entity.prevX + (entity.x - entity.prevX) * alpha;
        const renderY = entity.prevY + (entity.y - entity.prevY) * alpha;

        console.log(`Render: interpolated position = (${renderX.toFixed(2)}, ${renderY.toFixed(2)}), alpha = ${alpha.toFixed(3)}`);
    });

    loop.start();

    setTimeout(() => {
        loop.stop();
    }, 2000);
}

// ============================================================================
// Example 6: Pause/Resume for Game States
// ============================================================================

/**
 * Using pause/resume for game state management
 */
function pauseResumeExample() {
    console.log('\n=== Pause/Resume Example ===');

    const loop = new GameLoop();
    let gameTime = 0;

    loop.setPhysicsCallback((dt) => {
        gameTime += dt;
        console.log(`Game time: ${gameTime.toFixed(2)}s`);
    });

    loop.setRenderCallback((alpha) => {
        // Render game
    });

    loop.start();

    // Simulate game states
    setTimeout(() => {
        console.log('\n--- Pausing for menu ---');
        loop.pause();
    }, 2000);

    setTimeout(() => {
        console.log('\n--- Resuming game ---');
        loop.resume();
    }, 4000);

    setTimeout(() => {
        console.log('\n--- Pausing for pause menu ---');
        loop.pause();
    }, 6000);

    setTimeout(() => {
        console.log('\n--- Resuming game ---');
        loop.resume();
    }, 8000);

    setTimeout(() => {
        loop.stop();
        console.log(`\nFinal game time: ${gameTime.toFixed(2)}s`);
    }, 10000);
}

// ============================================================================
// Example 7: Error Handling
// ============================================================================

/**
 * Handling errors gracefully
 */
function errorHandlingExample() {
    console.log('\n=== Error Handling Example ===');

    const loop = new GameLoop();

    // Register error handler
    loop.onError((errorData) => {
        console.error(`Caught error in ${errorData.source}:`);
        console.error(`  Message: ${errorData.message}`);
        console.error(`  Timestamp: ${errorData.timestamp.toFixed(2)}ms`);
        // Loop continues running despite error
    });

    let callCount = 0;
    loop.setPhysicsCallback((dt) => {
        callCount++;

        // Simulate occasional error
        if (callCount === 5) {
            throw new Error('Simulated physics error');
        }

        console.log(`Physics update ${callCount}`);
    });

    loop.setRenderCallback((alpha) => {
        // Render
    });

    loop.start();

    setTimeout(() => {
        loop.stop();
        console.log('Loop completed despite error');
    }, 2000);
}

// ============================================================================
// Example 8: Factory Function
// ============================================================================

/**
 * Using the factory function to create game loop
 */
function factoryExample() {
    console.log('\n=== Factory Function Example ===');

    // Create using factory function
    const loop = createGameLoop({
        fixedDt: 1 / 60,
        maxFrameTime: 250,
        debug: false
    });

    loop.setPhysicsCallback((dt) => {
        // Physics
    });

    loop.setRenderCallback((alpha) => {
        // Render
    });

    loop.start();

    setTimeout(() => {
        loop.stop();
    }, 1000);
}

// ============================================================================
// Example 9: Cyber Cycles Integration
// ============================================================================

/**
 * Example integration with Cyber Cycles game
 */
function cyberCyclesIntegrationExample() {
    console.log('\n=== Cyber Cycles Integration Example ===');

    // Game state
    const gameState = {
        players: [],
        trails: [],
        camera: { x: 0, y: 0, zoom: 1 },
        isRunning: false
    };

    // Create game loop
    const loop = new GameLoop({
        fixedDt: 1 / 60,        // 60 Hz physics
        maxFrameTime: 250,       // Prevent spiral of death
        debug: false
    });

    // Physics callback - fixed timestep
    loop.setPhysicsCallback((fixedDt) => {
        if (!gameState.isRunning) return;

        // Update all players at fixed timestep
        for (const player of gameState.players) {
            // Apply input
            if (player.input.left) {
                player.angle -= player.turnSpeed * fixedDt;
            }
            if (player.input.right) {
                player.angle += player.turnSpeed * fixedDt;
            }

            // Update position
            player.x += Math.cos(player.angle) * player.speed * fixedDt;
            player.y += Math.sin(player.angle) * player.speed * fixedDt;

            // Add trail point
            player.trail.push({ x: player.x, y: player.y });
        }

        // Check collisions
        checkCollisions(gameState, fixedDt);
    });

    // Render callback - variable timestep with interpolation
    loop.setRenderCallback((alpha) => {
        // Clear screen
        // renderer.clear();

        // Interpolate player positions for smooth rendering
        for (const player of gameState.players) {
            const renderX = player.prevX + (player.x - player.prevX) * alpha;
            const renderY = player.prevY + (player.y - player.prevY) * alpha;

            // Render player at interpolated position
            // renderer.drawPlayer(renderX, renderY, player.angle);
        }

        // Render trails
        // renderer.drawTrails(gameState.trails);

        // Update camera
        // camera.update(alpha);
    });

    // Event handlers
    loop.onStart(() => {
        console.log('Cyber Cycles game loop started');
        gameState.isRunning = true;
    });

    loop.onStop(() => {
        console.log('Cyber Cycles game loop stopped');
        gameState.isRunning = false;
    });

    loop.onPause(() => {
        console.log('Game paused');
    });

    loop.onResume(() => {
        console.log('Game resumed');
    });

    loop.onFrame((frameData) => {
        // Update HUD with FPS
        // hud.updateFPS(frameData.fps);
    });

    loop.onError((errorData) => {
        console.error(`Game error: ${errorData.message}`);
        // Could trigger game state recovery here
    });

    // Start the game loop
    loop.start();

    // Helper function for collision detection
    function checkCollisions(state, dt) {
        // Collision detection logic here
        // This runs at fixed timestep for consistency
    }

    return { loop, gameState };
}

// ============================================================================
// Example 10: Dynamic Timestep Adjustment
// ============================================================================

/**
 * Adjusting timestep based on performance
 */
function dynamicTimestepExample() {
    console.log('\n=== Dynamic Timestep Example ===');

    const loop = new GameLoop({
        fixedDt: 1 / 60,
        maxFrameTime: 250
    });

    let frameCount = 0;
    let lastAdjustTime = 0;

    loop.onFrame((frameData) => {
        frameCount++;
        const now = frameData.elapsedTime;

        // Adjust timestep every 5 seconds based on performance
        if (now - lastAdjustTime > 5000) {
            lastAdjustTime = now;

            if (frameData.averageFps < 30) {
                // Lower physics frequency for better performance
                loop.setFixedDt(1 / 30);
                console.log('Reduced physics to 30 Hz for performance');
            } else if (frameData.averageFps > 55) {
                // Can handle higher physics frequency
                loop.setFixedDt(1 / 60);
                console.log('Increased physics to 60 Hz');
            }
        }
    });

    loop.setPhysicsCallback((dt) => {
        // Physics at variable timestep
    });

    loop.setRenderCallback((alpha) => {
        // Render
    });

    loop.start();

    setTimeout(() => {
        loop.stop();
    }, 12000);
}

// ============================================================================
// Run Examples
// ============================================================================

/**
 * Run all examples (uncomment to test)
 */
function runAllExamples() {
    // Note: These examples use setTimeout and can't all run simultaneously
    // Run them one at a time for testing

    basicExample();
    // customConfigExample();
    // eventHandlingExample();
    // statisticsExample();
    // interpolationExample();
    // pauseResumeExample();
    // errorHandlingExample();
    // factoryExample();
    // cyberCyclesIntegrationExample();
    // dynamicTimestepExample();
}

// Export examples for use in other modules
export {
    basicExample,
    customConfigExample,
    eventHandlingExample,
    statisticsExample,
    interpolationExample,
    pauseResumeExample,
    errorHandlingExample,
    factoryExample,
    cyberCyclesIntegrationExample,
    dynamicTimestepExample,
    runAllExamples
};

// Default export
export default {
    basicExample,
    customConfigExample,
    eventHandlingExample,
    statisticsExample,
    interpolationExample,
    pauseResumeExample,
    errorHandlingExample,
    factoryExample,
    cyberCyclesIntegrationExample,
    dynamicTimestepExample,
    runAllExamples
};
