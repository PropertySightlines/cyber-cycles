/**
 * TestOverlay Tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestOverlay } from '../../src/ui/TestOverlay.js';

describe('TestOverlay', () => {
    let overlay;
    
    beforeEach(() => {
        overlay = new TestOverlay({ visible: false });
    });
    
    afterEach(() => {
        if (overlay) {
            overlay.destroy();
        }
    });
    
    describe('Overlay Creation and Lifecycle', () => {
        it('should create overlay with default options', () => {
            expect(overlay).toBeDefined();
            expect(overlay.isVisible()).toBe(false);
        });
        
        it('should create overlay with visible option', () => {
            const visibleOverlay = new TestOverlay({ visible: true });
            expect(visibleOverlay.isVisible()).toBe(true);
            visibleOverlay.destroy();
        });
        
        it('should show overlay', () => {
            overlay.show();
            expect(overlay.isVisible()).toBe(true);
        });
        
        it('should hide overlay', () => {
            overlay.show();
            overlay.hide();
            expect(overlay.isVisible()).toBe(false);
        });
        
        it('should toggle overlay visibility', () => {
            expect(overlay.toggle()).toBe(true);
            expect(overlay.toggle()).toBe(false);
            expect(overlay.toggle()).toBe(true);
        });
        
        it('should create DOM elements on show', () => {
            overlay.show();
            expect(overlay.elements.container).toBeDefined();
            expect(overlay.elements.fps).toBeDefined();
            expect(overlay.elements.entities).toBeDefined();
        });
        
        it('should destroy DOM elements', () => {
            overlay.show();
            const container = overlay.elements.container;
            overlay.destroy();
            expect(overlay.elements.container).toBeUndefined();
        });
        
        it('should register default commands', () => {
            const commands = overlay.getCommandList();
            expect(commands).toContain('help');
            expect(commands).toContain('pause');
            expect(commands).toContain('resume');
            expect(commands).toContain('reset');
        });
        
        it('should set event callbacks', () => {
            const mockPause = vi.fn();
            overlay.onPause = mockPause;
            overlay.executeCommand('pause');
            expect(mockPause).toHaveBeenCalled();
        });
    });
    
    describe('Display Panels', () => {
        beforeEach(() => {
            overlay.show();
        });
        
        it('should show FPS', () => {
            overlay.showFPS(60, 16.67);
            expect(overlay.stats.fps).toBe(60);
            expect(overlay.stats.frameTime).toBe(16.67);
            expect(overlay.elements.fps.textContent).toContain('60');
        });
        
        it('should color FPS based on value', () => {
            overlay.showFPS(60, 16.67);
            expect(overlay.elements.fps.style.color).toBe('rgb(0, 255, 0)');
            
            overlay.showFPS(40, 25);
            expect(overlay.elements.fps.style.color).toBe('rgb(255, 255, 0)');
            
            overlay.showFPS(20, 50);
            expect(overlay.elements.fps.style.color).toBe('rgb(255, 0, 0)');
        });
        
        it('should show entity count', () => {
            overlay.showEntityCount(10, { player: 6, trail: 6 });
            expect(overlay.stats.entityCount).toBe(10);
            expect(overlay.elements.entities.textContent).toContain('10');
        });
        
        it('should show memory usage', () => {
            overlay.showMemoryUsage(50000000, 100000000);
            expect(overlay.stats.memoryUsed).toBe(50000000);
            expect(overlay.elements.memory.textContent).toContain('50.0%');
        });
        
        it('should show physics stats', () => {
            overlay.showPhysicsStats(100, 50, 10);
            expect(overlay.stats.physicsUpdates).toBe(100);
            expect(overlay.stats.collisions).toBe(50);
            expect(overlay.elements.physics.textContent).toContain('100 updates');
        });
        
        it('should show network stats', () => {
            overlay.showNetworkStats(200, 180, 50);
            expect(overlay.stats.inputsSent).toBe(200);
            expect(overlay.stats.latency).toBe(50);
            expect(overlay.elements.network.textContent).toContain('50ms latency');
        });
        
        it('should show player stats', () => {
            overlay.showPlayerStats('player1', { x: 100, z: 200 }, 40, true);
            expect(overlay.elements.player.textContent).toContain('player1');
            expect(overlay.elements.player.textContent).toContain('ALIVE');
        });
        
        it('should format bytes correctly', () => {
            expect(overlay.formatBytes(0)).toBe('0 B');
            expect(overlay.formatBytes(1024)).toBe('1 KB');
            expect(overlay.formatBytes(1048576)).toBe('1 MB');
        });
    });
    
    describe('Debug Commands', () => {
        it('should execute help command', () => {
            const result = overlay.executeCommand('help');
            expect(result).toBe(true);
            expect(overlay.logs.some(l => l.message.includes('Available commands'))).toBe(true);
        });
        
        it('should execute pause command', () => {
            overlay.onPause = vi.fn();
            overlay.executeCommand('pause');
            expect(overlay.onPause).toHaveBeenCalled();
        });
        
        it('should execute resume command', () => {
            overlay.onResume = vi.fn();
            overlay.executeCommand('resume');
            expect(overlay.onResume).toHaveBeenCalled();
        });
        
        it('should execute reset command', () => {
            overlay.onReset = vi.fn();
            overlay.executeCommand('reset');
            expect(overlay.onReset).toHaveBeenCalled();
        });
        
        it('should execute spectate command', () => {
            overlay.onSpectate = vi.fn();
            overlay.executeCommand('spectate');
            expect(overlay.onSpectate).toHaveBeenCalled();
        });
        
        it('should execute ai command with count', () => {
            overlay.onSetAI = vi.fn();
            overlay.executeCommand('ai 3');
            expect(overlay.onSetAI).toHaveBeenCalledWith(3);
        });
        
        it('should execute speed command', () => {
            overlay.onSetSpeed = vi.fn();
            overlay.executeCommand('speed 2.0');
            expect(overlay.onSetSpeed).toHaveBeenCalledWith(2.0);
        });
        
        it('should execute clear command', () => {
            overlay.log('test message');
            overlay.log('another message');
            const initialLength = overlay.logs.length;
            expect(initialLength).toBe(2);
            overlay.executeCommand('clear');
            // Clear command logs the command and result, but clears previous logs
            expect(overlay.logs.length).toBe(2);
            expect(overlay.logs.every(l => l.message.includes('clear'))).toBe(true);
        });
        
        it('should execute stats command', () => {
            overlay.stats.fps = 60;
            const result = overlay.executeCommand('stats');
            expect(result).toBe(true);
        });
        
        it('should handle unknown command', () => {
            const result = overlay.executeCommand('nonexistent');
            expect(result).toBe(false);
            expect(overlay.logs.some(l => l.type === 'error')).toBe(true);
        });
        
        it('should register custom command', () => {
            const callback = vi.fn().mockReturnValue('result');
            overlay.registerCommand('testcmd', callback);
            overlay.executeCommand('testcmd arg1');
            expect(callback).toHaveBeenCalledWith(['arg1']);
        });
        
        it('should handle command errors', () => {
            overlay.registerCommand('errorcmd', () => { throw new Error('test error'); });
            const result = overlay.executeCommand('errorcmd');
            expect(result).toBe(false);
            expect(overlay.logs.some(l => l.type === 'error' && l.message.includes('test error'))).toBe(true);
        });
    });
    
    describe('Console Output', () => {
        it('should log messages', () => {
            overlay.log('test message');
            expect(overlay.logs.length).toBe(1);
            expect(overlay.logs[0].message).toBe('test message');
            expect(overlay.logs[0].type).toBe('info');
        });
        
        it('should log with different types', () => {
            overlay.log('error', 'error');
            overlay.log('command', 'command');
            overlay.log('result', 'result');
            expect(overlay.logs.map(l => l.type)).toEqual(['error', 'command', 'result']);
        });
        
        it('should limit log size', () => {
            for (let i = 0; i < 150; i++) {
                overlay.log(`message ${i}`);
            }
            expect(overlay.logs.length).toBeLessThanOrEqual(100);
        });
        
        it('should clear logs', () => {
            overlay.log('test');
            overlay.clear();
            expect(overlay.logs.length).toBe(0);
        });
        
        it('should show/hide log panel', () => {
            overlay.show();
            overlay.showLog();
            expect(overlay.options.showLog).toBe(true);
            overlay.hideLog();
            expect(overlay.options.showLog).toBe(false);
        });
    });
    
    describe('DOM Management', () => {
        it('should create all DOM elements', () => {
            overlay.show();
            expect(overlay.elements.container).toBeDefined();
            expect(overlay.elements.fps).toBeDefined();
            expect(overlay.elements.entities).toBeDefined();
            expect(overlay.elements.memory).toBeDefined();
            expect(overlay.elements.physics).toBeDefined();
            expect(overlay.elements.network).toBeDefined();
            expect(overlay.elements.player).toBeDefined();
            expect(overlay.elements.logContent).toBeDefined();
            expect(overlay.elements.cmdInput).toBeDefined();
        });
        
        it('should handle command input enter key', () => {
            overlay.show();
            const input = overlay.elements.cmdInput;
            const executeSpy = vi.spyOn(overlay, 'executeCommand');
            
            input.value = 'help';
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            
            expect(executeSpy).toHaveBeenCalledWith('help');
        });
    });
});
