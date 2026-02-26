/**
 * TestOverlay - Debug and testing UI overlay for Cyber Cycles
 * Shows FPS, entity counts, memory, physics stats, and debug commands
 */

export class TestOverlay {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'top-left',
            visible: options.visible !== false,
            showFPS: true,
            showStats: true,
            showLog: false
        };
        
        this.visible = this.options.visible;
        this.commands = new Map();
        this.logs = [];
        this.maxLogs = 100;
        this.stats = {
            fps: 0,
            frameTime: 0,
            entityCount: 0,
            entityByType: {},
            memoryUsed: 0,
            memoryTotal: 0,
            physicsUpdates: 0,
            collisions: 0,
            rubberEvents: 0,
            inputsSent: 0,
            inputsAcked: 0,
            latency: 0
        };
        
        this.elements = {};
        this.registerDefaultCommands();
        
        if (this.visible) {
            this.createDOM();
        }
    }
    
    // Visibility
    show() {
        this.visible = true;
        if (!this.elements.container) {
            this.createDOM();
        }
        this.elements.container.style.display = 'block';
    }
    
    hide() {
        this.visible = false;
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
        }
    }
    
    toggle() {
        this.visible = !this.visible;
        if (this.visible) {
            this.show();
        } else {
            this.hide();
        }
        return this.visible;
    }
    
    isVisible() {
        return this.visible;
    }
    
    // Display methods
    showFPS(fps, frameTime) {
        this.stats.fps = fps;
        this.stats.frameTime = frameTime;
        if (this.elements.fps) {
            this.elements.fps.textContent = `FPS: ${fps.toFixed(1)} | Frame: ${frameTime.toFixed(2)}ms`;
            this.elements.fps.style.color = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
        }
    }
    
    showEntityCount(count, byType = {}) {
        this.stats.entityCount = count;
        this.stats.entityByType = byType;
        if (this.elements.entities) {
            const typeStr = Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(' ');
            this.elements.entities.textContent = `Entities: ${count} ${typeStr ? `(${typeStr})` : ''}`;
        }
    }
    
    showMemoryUsage(used, total) {
        this.stats.memoryUsed = used;
        this.stats.memoryTotal = total;
        if (this.elements.memory) {
            const percent = total > 0 ? ((used / total) * 100).toFixed(1) : 0;
            this.elements.memory.textContent = `Memory: ${this.formatBytes(used)} / ${this.formatBytes(total)} (${percent}%)`;
        }
    }
    
    showPhysicsStats(updates, collisions, rubber) {
        this.stats.physicsUpdates = updates;
        this.stats.collisions = collisions;
        this.stats.rubberEvents = rubber;
        if (this.elements.physics) {
            this.elements.physics.textContent = `Physics: ${updates} updates | ${collisions} collisions | ${rubber} rubber`;
        }
    }
    
    showNetworkStats(inputs, acks, latency) {
        this.stats.inputsSent = inputs;
        this.stats.inputsAcked = acks;
        this.stats.latency = latency;
        if (this.elements.network) {
            this.elements.network.textContent = `Network: ${inputs} inputs | ${acks} acked | ${latency}ms latency`;
        }
    }
    
    showPlayerStats(playerId, position, speed, alive) {
        if (this.elements.player) {
            const posStr = position ? `(${position.x?.toFixed(1) || 0}, ${position.z?.toFixed(1) || 0})` : '(0, 0)';
            const aliveStr = alive ? 'ALIVE' : 'DEAD';
            this.elements.player.textContent = `Player: ${playerId || 'None'} | Pos: ${posStr} | Speed: ${speed?.toFixed(1) || 0} | ${aliveStr}`;
        }
    }
    
    // Debug commands
    registerCommand(name, callback) {
        this.commands.set(name.toLowerCase(), callback);
    }
    
    executeCommand(commandLine) {
        const parts = commandLine.trim().split(/\s+/);
        const name = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        const cmd = this.commands.get(name);
        if (!cmd) {
            this.log(`Unknown command: ${name}. Type 'help' for available commands.`, 'error');
            return false;
        }
        
        try {
            const result = cmd(args);
            this.log(`> ${commandLine}`, 'command');
            if (result !== undefined) {
                this.log(String(result), 'result');
            }
            return true;
        } catch (err) {
            this.log(`Error: ${err.message}`, 'error');
            return false;
        }
    }
    
    getCommandList() {
        return Array.from(this.commands.keys()).sort();
    }
    
    showCommandHelp() {
        const help = [
            'Available commands:',
            '  pause          - Pause game',
            '  resume         - Resume game',
            '  step           - Step one frame',
            '  reset          - Reset game state',
            '  spectate       - Toggle spectate mode',
            '  ai [count]     - Set AI count (default: 5)',
            '  speed [value]  - Set game speed multiplier (default: 1.0)',
            '  clear          - Clear console log',
            '  help           - Show this help',
            '  stats          - Show current stats',
            '  entities       - List entity types',
            '  memory         - Show memory usage',
            '  pos            - Show player position'
        ];
        return help.join('\n');
    }
    
    registerDefaultCommands() {
        this.registerCommand('help', () => this.showCommandHelp());
        this.registerCommand('pause', () => { if (this.onPause) this.onPause(); return 'Game paused'; });
        this.registerCommand('resume', () => { if (this.onResume) this.onResume(); return 'Game resumed'; });
        this.registerCommand('step', () => { if (this.onStep) this.onStep(); return 'Stepped one frame'; });
        this.registerCommand('reset', () => { if (this.onReset) this.onReset(); return 'Game reset'; });
        this.registerCommand('spectate', () => { if (this.onSpectate) this.onSpectate(); return 'Spectate mode toggled'; });
        this.registerCommand('ai', (args) => { 
            const count = parseInt(args[0]) || 5;
            if (this.onSetAI) this.onSetAI(count);
            return `AI count set to ${count}`;
        });
        this.registerCommand('speed', (args) => {
            const speed = parseFloat(args[0]) || 1.0;
            if (this.onSetSpeed) this.onSetSpeed(speed);
            return `Game speed set to ${speed}x`;
        });
        this.registerCommand('clear', () => { this.logs = []; this.updateLog(); if (this.elements.logContent) this.elements.logContent.innerHTML = ''; return 'Console cleared'; });
        this.registerCommand('stats', () => {
            return `FPS: ${this.stats.fps.toFixed(1)} | Entities: ${this.stats.entityCount} | Memory: ${this.formatBytes(this.stats.memoryUsed)}`;
        });
        this.registerCommand('entities', () => {
            return Object.entries(this.stats.entityByType).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No entities';
        });
        this.registerCommand('memory', () => {
            return `${this.formatBytes(this.stats.memoryUsed)} / ${this.formatBytes(this.stats.memoryTotal)}`;
        });
        this.registerCommand('pos', () => {
            return this.elements.player ? this.elements.player.textContent : 'No player data';
        });
    }
    
    // Console output
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.push({ timestamp, message, type });
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        this.updateLog();
    }
    
    clear() {
        this.logs = [];
        this.updateLog();
    }
    
    showLog() {
        this.options.showLog = true;
        if (this.elements.logPanel) {
            this.elements.logPanel.style.display = 'block';
        }
    }
    
    hideLog() {
        this.options.showLog = false;
        if (this.elements.logPanel) {
            this.elements.logPanel.style.display = 'none';
        }
    }
    
    updateLog() {
        if (!this.elements.logContent) return;
        this.elements.logContent.innerHTML = this.logs
            .map(log => `<div class="log-entry log-${log.type}">[${log.timestamp}] ${log.message}</div>`)
            .join('');
        this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
    }
    
    // Rendering
    render() {
        // Called each frame if needed
    }
    
    update() {
        // Update displayed values if needed
    }
    
    createDOM() {
        // Remove existing if present
        if (this.elements.container) {
            this.destroy();
        }
        
        // Main container
        const container = document.createElement('div');
        container.id = 'test-overlay';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #00ff00;
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = 'font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;';
        header.textContent = '🔧 DEBUG OVERLAY (F1 to toggle)';
        container.appendChild(header);
        
        // Stats panels
        const createPanel = (id, title) => {
            const panel = document.createElement('div');
            panel.id = id;
            panel.style.cssText = 'margin: 5px 0; padding: 5px; background: rgba(0, 50, 0, 0.5); border-radius: 3px;';
            const titleEl = document.createElement('div');
            titleEl.style.cssText = 'font-weight: bold; color: #ffffff; margin-bottom: 3px;';
            titleEl.textContent = title;
            panel.appendChild(titleEl);
            const contentEl = document.createElement('div');
            contentEl.style.cssText = 'margin-left: 10px;';
            panel.appendChild(contentEl);
            return { panel, content: contentEl };
        };
        
        // FPS panel
        let panel = createPanel('fps-panel', '⏱️ Performance');
        this.elements.fps = panel.content;
        this.elements.fps.textContent = 'FPS: -- | Frame: --ms';
        container.appendChild(panel.panel);
        
        // Entities panel
        panel = createPanel('entity-panel', '📦 Entities');
        this.elements.entities = panel.content;
        this.elements.entities.textContent = 'Entities: --';
        container.appendChild(panel.panel);
        
        // Memory panel
        panel = createPanel('memory-panel', '💾 Memory');
        this.elements.memory = panel.content;
        this.elements.memory.textContent = 'Memory: -- / --';
        container.appendChild(panel.panel);
        
        // Physics panel
        panel = createPanel('physics-panel', '⚛️ Physics');
        this.elements.physics = panel.content;
        this.elements.physics.textContent = 'Physics: -- updates | -- collisions';
        container.appendChild(panel.panel);
        
        // Network panel
        panel = createPanel('network-panel', '🌐 Network');
        this.elements.network = panel.content;
        this.elements.network.textContent = 'Network: -- inputs | -- acked';
        container.appendChild(panel.panel);
        
        // Player panel
        panel = createPanel('player-panel', '👤 Player');
        this.elements.player = panel.content;
        this.elements.player.textContent = 'Player: -- | Pos: -- | Speed: -- | --';
        container.appendChild(panel.panel);
        
        // Command input
        const cmdContainer = document.createElement('div');
        cmdContainer.style.cssText = 'margin-top: 10px; border-top: 1px solid #00ff00; padding-top: 10px;';
        const cmdLabel = document.createElement('div');
        cmdLabel.textContent = 'Command:';
        cmdLabel.style.cssText = 'margin-bottom: 5px;';
        cmdContainer.appendChild(cmdLabel);
        
        const cmdInput = document.createElement('input');
        cmdInput.type = 'text';
        cmdInput.id = 'debug-command-input';
        cmdInput.style.cssText = `
            width: 100%;
            background: #001100;
            color: #00ff00;
            border: 1px solid #00ff00;
            padding: 5px;
            font-family: 'Courier New', monospace;
            border-radius: 3px;
        `;
        cmdInput.placeholder = 'Type command (help for list)...';
        cmdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = cmdInput.value;
                if (cmd.trim()) {
                    this.executeCommand(cmd);
                    cmdInput.value = '';
                }
            }
        });
        cmdContainer.appendChild(cmdInput);
        container.appendChild(cmdContainer);
        
        // Log panel
        const logPanel = document.createElement('div');
        logPanel.id = 'debug-log-panel';
        logPanel.style.cssText = `
            margin-top: 10px;
            border-top: 1px solid #00ff00;
            padding-top: 10px;
            display: ${this.options.showLog ? 'block' : 'none'};
        `;
        const logHeader = document.createElement('div');
        logHeader.style.cssText = 'font-weight: bold; margin-bottom: 5px;';
        logHeader.textContent = '📋 Log:';
        logPanel.appendChild(logHeader);
        
        const logContent = document.createElement('div');
        logContent.id = 'debug-log-content';
        logContent.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
            background: #001100;
            padding: 5px;
            border-radius: 3px;
            font-size: 11px;
        `;
        logPanel.appendChild(logContent);
        container.appendChild(logPanel);
        
        this.elements.container = container;
        this.elements.logPanel = logPanel;
        this.elements.logContent = logContent;
        this.elements.cmdInput = cmdInput;
        
        document.body.appendChild(container);
    }
    
    destroy() {
        if (this.elements.container && this.elements.container.parentNode) {
            this.elements.container.parentNode.removeChild(this.elements.container);
        }
        this.elements = {};
    }
    
    // Utility
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Event callbacks (to be set by main.js)
    onPause = null;
    onResume = null;
    onStep = null;
    onReset = null;
    onSpectate = null;
    onSetAI = null;
    onSetSpeed = null;
}

export default TestOverlay;
