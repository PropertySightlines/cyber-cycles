/**
 * SpatialHash - A spatial hash grid for O(log n) collision queries
 *
 * This class implements a spatial partitioning data structure that divides
 * 2D space into a grid of cells. Entities are hashed into cells based on
 * their position, allowing for efficient range queries and collision detection.
 *
 * Key features:
 * - Configurable cell size (default: 5.0 units)
 * - O(1) insert, remove, and update operations
 * - O(k) range queries where k is the number of entities in range
 * - Automatic cell cleanup for memory efficiency
 * - Debug visualization and export/import support
 *
 * @example
 * const spatialHash = new SpatialHash(5.0);
 * spatialHash.insert('entity1', 10, 20);
 * spatialHash.insert('entity2', 12, 22);
 * const nearby = spatialHash.queryRange(11, 21, 5);
 */

export class SpatialHash {
    /**
     * Creates a new SpatialHash instance
     * @param {number} cellSize - The size of each grid cell (default: 5.0)
     */
    constructor(cellSize = 5.0) {
        if (cellSize <= 0) {
            throw new Error('Cell size must be positive');
        }
        this.cellSize = cellSize;
        
        // Map of cellKey -> Set of entity IDs
        // cellKey format: "gridX,gridZ"
        this._grid = new Map();
        
        // Map of entityId -> {x, z, cellKey} for quick lookups
        this._entityPositions = new Map();
    }

    /**
     * Computes the grid cell coordinates for a given position
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {{gridX: number, gridZ: number}} Grid cell coordinates
     * @private
     */
    _getCellCoords(x, z) {
        const gridX = Math.floor(x / this.cellSize);
        const gridZ = Math.floor(z / this.cellSize);
        return { gridX, gridZ };
    }

    /**
     * Creates a hash key for a grid cell
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridZ - Grid Z coordinate
     * @returns {string} Cell key in format "gridX,gridZ"
     * @private
     */
    _hashKey(gridX, gridZ) {
        return `${gridX},${gridZ}`;
    }

    /**
     * Gets or creates a cell set for the given key
     * @param {string} cellKey - The cell key
     * @returns {Set<string>} The set of entity IDs in the cell
     * @private
     */
    _getCell(cellKey) {
        if (!this._grid.has(cellKey)) {
            this._grid.set(cellKey, new Set());
        }
        return this._grid.get(cellKey);
    }

    /**
     * Inserts an entity into the spatial hash at the given position
     * @param {string|number} entityId - Unique identifier for the entity
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {boolean} True if inserted successfully
     */
    insert(entityId, x, z) {
        if (entityId === undefined || entityId === null) {
            throw new Error('Entity ID cannot be null or undefined');
        }

        // If entity already exists, update its position instead
        if (this._entityPositions.has(entityId)) {
            return this.update(entityId, x, z);
        }

        const { gridX, gridZ } = this._getCellCoords(x, z);
        const cellKey = this._hashKey(gridX, gridZ);
        
        const cell = this._getCell(cellKey);
        cell.add(entityId);
        
        this._entityPositions.set(entityId, { x, z, cellKey, gridX, gridZ });
        
        return true;
    }

    /**
     * Removes an entity from the spatial hash
     * @param {string|number} entityId - The entity ID to remove
     * @returns {boolean} True if entity was found and removed, false otherwise
     */
    remove(entityId) {
        const entityData = this._entityPositions.get(entityId);
        if (!entityData) {
            return false;
        }

        const cell = this._grid.get(entityData.cellKey);
        if (cell) {
            cell.delete(entityId);
            // Clean up empty cells to save memory
            if (cell.size === 0) {
                this._grid.delete(entityData.cellKey);
            }
        }

        this._entityPositions.delete(entityId);
        return true;
    }

    /**
     * Updates an entity's position in the spatial hash
     * @param {string|number} entityId - The entity ID to update
     * @param {number} x - New X coordinate
     * @param {number} z - New Z coordinate
     * @returns {boolean} True if entity was found and updated, false otherwise
     */
    update(entityId, x, z) {
        const entityData = this._entityPositions.get(entityId);
        if (!entityData) {
            return false;
        }

        const { gridX, gridZ } = this._getCellCoords(x, z);
        const newCellKey = this._hashKey(gridX, gridZ);

        // Only move to new cell if it changed
        if (newCellKey !== entityData.cellKey) {
            // Remove from old cell
            const oldCell = this._grid.get(entityData.cellKey);
            if (oldCell) {
                oldCell.delete(entityId);
                // Clean up empty cells
                if (oldCell.size === 0) {
                    this._grid.delete(entityData.cellKey);
                }
            }

            // Add to new cell
            const newCell = this._getCell(newCellKey);
            newCell.add(entityId);
        }

        // Update stored position
        this._entityPositions.set(entityId, { x, z, cellKey: newCellKey, gridX, gridZ });
        
        return true;
    }

    /**
     * Queries all entities within a radius of the given position
     * Checks all cells that could potentially contain entities within the radius
     * @param {number} x - Center X coordinate
     * @param {number} z - Center Z coordinate
     * @param {number} radius - Query radius
     * @returns {Array<{id: string|number, x: number, z: number, distance: number}>}
     *          Array of entities with their positions and distances
     */
    queryRange(x, z, radius) {
        const results = [];
        const radiusSquared = radius * radius;
        
        // Get the center cell
        const { gridX, gridZ } = this._getCellCoords(x, z);
        
        // Calculate how many cells out we need to check based on radius
        // This ensures we don't miss entities that are within radius but in farther cells
        const cellsOut = Math.ceil(radius / this.cellSize);
        
        // Check all cells within range (not just 3x3)
        for (let dx = -cellsOut; dx <= cellsOut; dx++) {
            for (let dz = -cellsOut; dz <= cellsOut; dz++) {
                const checkGridX = gridX + dx;
                const checkGridZ = gridZ + dz;
                const cellKey = this._hashKey(checkGridX, checkGridZ);
                
                const cell = this._grid.get(cellKey);
                if (!cell) continue;

                // Check each entity in the cell
                for (const entityId of cell) {
                    const entityData = this._entityPositions.get(entityId);
                    if (!entityData) continue;

                    // Calculate squared distance (avoid sqrt for performance)
                    const dx_pos = entityData.x - x;
                    const dz_pos = entityData.z - z;
                    const distSquared = dx_pos * dx_pos + dz_pos * dz_pos;

                    if (distSquared <= radiusSquared) {
                        results.push({
                            id: entityId,
                            x: entityData.x,
                            z: entityData.z,
                            distance: Math.sqrt(distSquared)
                        });
                    }
                }
            }
        }

        // Sort by distance (closest first)
        results.sort((a, b) => a.distance - b.distance);
        
        return results;
    }

    /**
     * Gets all entity IDs within a radius (without distance calculations)
     * @param {number} x - Center X coordinate
     * @param {number} z - Center Z coordinate
     * @param {number} radius - Query radius
     * @returns {Array<string|number>} Array of entity IDs
     */
    queryIds(x, z, radius) {
        return this.queryRange(x, z, radius).map(e => e.id);
    }

    /**
     * Checks if an entity exists in the spatial hash
     * @param {string|number} entityId - The entity ID to check
     * @returns {boolean} True if entity exists
     */
    has(entityId) {
        return this._entityPositions.has(entityId);
    }

    /**
     * Gets the position of an entity
     * @param {string|number} entityId - The entity ID
     * @returns {{x: number, z: number}|null} Position or null if not found
     */
    getPosition(entityId) {
        const entityData = this._entityPositions.get(entityId);
        if (!entityData) return null;
        return { x: entityData.x, z: entityData.z };
    }

    /**
     * Gets the total number of entities in the spatial hash
     * @returns {number} Entity count
     */
    size() {
        return this._entityPositions.size;
    }

    /**
     * Gets the total number of occupied cells
     * @returns {number} Cell count
     */
    cellCount() {
        return this._grid.size;
    }

    /**
     * Clears all entities from the spatial hash
     */
    clear() {
        this._grid.clear();
        this._entityPositions.clear();
    }

    /**
     * Gets all entities in a specific cell
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridZ - Grid Z coordinate
     * @returns {Array<string|number>} Array of entity IDs in the cell
     */
    getCellEntities(gridX, gridZ) {
        const cellKey = this._hashKey(gridX, gridZ);
        const cell = this._grid.get(cellKey);
        return cell ? Array.from(cell) : [];
    }

    /**
     * Returns debug information about the spatial hash
     * @returns {{
     *   entityCount: number,
     *   cellCount: number,
     *   cellSize: number,
     *   avgEntitiesPerCell: number,
     *   maxEntitiesInCell: number,
     *   emptyCells: number
     * }}
     */
    getDebugInfo() {
        let maxEntitiesInCell = 0;
        let totalEntities = 0;
        
        for (const cell of this._grid.values()) {
            const size = cell.size;
            totalEntities += size;
            if (size > maxEntitiesInCell) {
                maxEntitiesInCell = size;
            }
        }

        const cellCount = this._grid.size;
        
        return {
            entityCount: this._entityPositions.size,
            cellCount,
            cellSize: this.cellSize,
            avgEntitiesPerCell: cellCount > 0 ? (totalEntities / cellCount).toFixed(2) : 0,
            maxEntitiesInCell,
            minEntitiesInCell: cellCount > 0 ? Math.min(...[...this._grid.values()].map(c => c.size)) : 0
        };
    }

    /**
     * Returns a visual representation of the grid for debugging
     * @param {number} minX - Minimum X to display
     * @param {number} maxX - Maximum X to display
     * @param {number} minZ - Minimum Z to display
     * @param {number} maxZ - Maximum Z to display
     * @returns {string} ASCII representation of the grid
     */
    debugVisualize(minX, maxX, minZ, maxZ) {
        const startGridX = Math.floor(minX / this.cellSize);
        const endGridX = Math.floor(maxX / this.cellSize);
        const startGridZ = Math.floor(minZ / this.cellSize);
        const endGridZ = Math.floor(maxZ / this.cellSize);

        let output = 'Spatial Hash Grid Visualization\n';
        output += `Cell Size: ${this.cellSize}\n`;
        output += `Entities: ${this.size()}, Cells: ${this.cellCount()}\n`;
        output += '='.repeat(60) + '\n';

        // Z axis goes from high to low (top to bottom in display)
        for (let gz = endGridZ; gz >= startGridZ; gz--) {
            let row = '';
            for (let gx = startGridX; gx <= endGridX; gx++) {
                const cellKey = this._hashKey(gx, gz);
                const cell = this._grid.get(cellKey);
                const count = cell ? cell.size : 0;
                
                if (count === 0) {
                    row += ' . ';
                } else if (count < 10) {
                    row += ` ${count} `;
                } else {
                    row += ` ${count.toString().substring(0, 2)} `;
                }
            }
            output += row + '\n';
        }

        output += '='.repeat(60) + '\n';
        output += `Grid range: X[${startGridX}-${endGridX}], Z[${startGridZ}-${endGridZ}]\n`;
        
        return output;
    }

    /**
     * Exports the spatial hash data for serialization
     * @returns {{
     *   cellSize: number,
     *   entities: Array<{id: string|number, x: number, z: number}>
     * }}
     */
    export() {
        const entities = [];
        for (const [entityId, data] of this._entityPositions.entries()) {
            entities.push({
                id: entityId,
                x: data.x,
                z: data.z
            });
        }
        return {
            cellSize: this.cellSize,
            entities
        };
    }

    /**
     * Imports data into the spatial hash
     * @param {{cellSize?: number, entities: Array<{id: string|number, x: number, z: number}>}} data
     */
    import(data) {
        if (data.cellSize && data.cellSize !== this.cellSize) {
            this.cellSize = data.cellSize;
        }
        this.clear();
        for (const entity of data.entities) {
            this.insert(entity.id, entity.x, entity.z);
        }
    }
}

/**
 * Creates a new SpatialHash with the default cell size of 5.0
 * @returns {SpatialHash}
 */
export function createSpatialHash(cellSize = 5.0) {
    return new SpatialHash(cellSize);
}

export default SpatialHash;
