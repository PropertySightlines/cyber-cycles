/**
 * TrailEntity - Player trail/wall management for Cyber Cycles
 *
 * Manages player trails (walls) with efficient segment storage, spatial hash
 * integration for O(log n) queries, Three.js geometry compatibility, and
 * network serialization support.
 *
 * Key features:
 * - Efficient segment storage with automatic length management
 * - SpatialHash integration for fast proximity queries
 * - Three.js BufferGeometry compatibility for rendering
 * - Network serialization for multiplayer sync
 * - Collision detection integration
 *
 * @example
 * const trail = new TrailEntity('player1', { color: 0xff0000, maxLength: 200 });
 * trail.addPoint(0, 0);
 * trail.addPoint(10, 0);
 * trail.addPoint(20, 5);
 *
 * @module TrailEntity
 */

import { SpatialHash } from '../core/SpatialHash.js';
import { segmentLength, isPointNearSegment, distanceToSegmentWithClosest } from '../physics/CollisionDetection.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default trail configuration
 */
export const TRAIL_DEFAULTS = {
    /** Default trail color (white) */
    color: 0xffffff,
    /** Default maximum trail length in units */
    maxLength: 200,
    /** Default trail height for rendering */
    height: 2.0,
    /** Default trail width for rendering */
    width: 0.5,
    /** Minimum distance between trail points */
    minPointSpacing: 1.0,
    /** Spatial hash cell size for trail queries */
    spatialHashCellSize: 10.0
};

/**
 * Trail segment structure
 * @typedef {Object} TrailSegment
 * @property {number} x1 - Start X coordinate
 * @property {number} z1 - Start Z coordinate
 * @property {number} x2 - End X coordinate
 * @property {number} z2 - End Z coordinate
 * @property {number} length - Segment length
 * @property {string} pid - Player ID who owns this segment
 */

// ============================================================================
// TrailEntity Class
// ============================================================================

/**
 * TrailEntity class for managing player trails/walls
 *
 * Provides comprehensive trail management including:
 * - Point addition and segment creation
 * - Length enforcement and trimming
 * - Spatial hash integration for fast queries
 * - Three.js render data generation
 * - Collision detection support
 * - Network serialization
 */
export class TrailEntity {
    /**
     * Create a TrailEntity
     * @param {string} playerId - Unique player ID who owns this trail
     * @param {Object} [options] - Trail configuration options
     * @param {number} [options.color=0xffffff] - Trail color (hex)
     * @param {number} [options.maxLength=200] - Maximum trail length
     * @param {number} [options.height=2.0] - Trail height for rendering
     * @param {number} [options.width=0.5] - Trail width for rendering
     * @param {number} [options.minPointSpacing=1.0] - Minimum spacing between points
     * @param {number} [options.spatialHashCellSize=10.0] - Spatial hash cell size
     */
    constructor(playerId, options = {}) {
        if (!playerId) {
            throw new Error('Player ID is required for TrailEntity');
        }

        /** @type {string} Player ID who owns this trail */
        this.playerId = playerId;

        /** @type {number} Trail color (hex) */
        this.color = options.color !== undefined ? options.color : TRAIL_DEFAULTS.color;

        /** @type {number} Maximum trail length */
        this.maxLength = options.maxLength !== undefined ? options.maxLength : TRAIL_DEFAULTS.maxLength;

        /** @type {number} Trail height for rendering */
        this.height = options.height !== undefined ? options.height : TRAIL_DEFAULTS.height;

        /** @type {number} Trail width for rendering */
        this.width = options.width !== undefined ? options.width : TRAIL_DEFAULTS.width;

        /** @type {number} Minimum spacing between trail points */
        this.minPointSpacing = options.minPointSpacing !== undefined
            ? options.minPointSpacing
            : TRAIL_DEFAULTS.minPointSpacing;

        /** @type {number} Spatial hash cell size */
        this.spatialHashCellSize = options.spatialHashCellSize !== undefined
            ? options.spatialHashCellSize
            : TRAIL_DEFAULTS.spatialHashCellSize;

        /** @type {Array<{x: number, z: number}>} Array of trail points */
        this.segments = [];

        /** @type {Array<TrailSegment>} Cached segment data for collision */
        this._cachedSegments = [];

        /** @type {number} Total trail length */
        this._totalLength = 0;

        /** @type {SpatialHash|null} Spatial hash for fast queries */
        this._spatialHash = null;

        /** @type {boolean} Whether spatial hash is enabled */
        this._spatialHashEnabled = false;

        /** @type {number} Last update timestamp for dirty tracking */
        this._lastUpdate = Date.now();

        /** @type {boolean} Whether trail data has changed */
        this._isDirty = true;
    }

    // ========================================================================
    // Trail Management
    // ========================================================================

    /**
     * Add a trail point
     * Creates a new segment from the last point to the new point.
     *
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @returns {boolean} True if point was added, false if too close to last point
     */
    addPoint(x, z) {
        const lastPoint = this.segments[this.segments.length - 1];

        // Check minimum spacing
        if (lastPoint) {
            const dx = x - lastPoint.x;
            const dz = z - lastPoint.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < this.minPointSpacing) {
                return false;
            }

            // Calculate new length with this segment
            const newSegmentLength = dist;
            const currentLength = this.getLength();
            const newTotalLength = currentLength + newSegmentLength;

            this.segments.push({ x, z });
            this._isDirty = true;
            this._lastUpdate = Date.now();

            // Update spatial hash if enabled
            if (this._spatialHashEnabled && this._spatialHash) {
                const segmentIndex = this.segments.length - 1;
                this._spatialHash.insert(`seg_${segmentIndex}`, x, z);
            }

            // Enforce max length if exceeded
            if (newTotalLength > this.maxLength) {
                this.enforceMaxLength(this.maxLength);
            }

            return true;
        }

        // First point - just add it
        this.segments.push({ x, z });
        this._isDirty = true;
        this._lastUpdate = Date.now();

        // Update spatial hash if enabled
        if (this._spatialHashEnabled && this._spatialHash) {
            const segmentIndex = this.segments.length - 1;
            this._spatialHash.insert(`seg_${segmentIndex}`, x, z);
        }

        return true;
    }

    /**
     * Get all trail segments
     * Returns cached segment data with precomputed lengths.
     *
     * @returns {Array<TrailSegment>} Array of trail segments
     */
    getSegments() {
        if (this._isDirty) {
            this._updateCachedSegments();
        }
        return this._cachedSegments;
    }

    /**
     * Get a specific segment by index
     *
     * @param {number} index - Segment index
     * @returns {TrailSegment|null} Segment data or null if invalid index
     */
    getSegment(index) {
        if (this._isDirty) {
            this._updateCachedSegments();
        }

        if (index < 0 || index >= this._cachedSegments.length) {
            return null;
        }

        return this._cachedSegments[index];
    }

    /**
     * Get the number of segments
     *
     * @returns {number} Segment count
     */
    segmentCount() {
        return Math.max(0, this.segments.length - 1);
    }

    /**
     * Clear all trail points
     * Removes all points and resets length to zero.
     */
    clear() {
        this.segments = [];
        this._cachedSegments = [];
        this._totalLength = 0;
        this._isDirty = true;
        this._lastUpdate = Date.now();

        // Clear spatial hash if enabled
        if (this._spatialHashEnabled && this._spatialHash) {
            this._spatialHash.clear();
        }
    }

    /**
     * Trim trail to maximum length
     * Removes oldest segments until trail is within max length.
     *
     * @param {number} [maxLength] - Maximum length (uses instance maxLength if not provided)
     * @returns {number} Number of segments removed
     */
    trimToLength(maxLength) {
        const maxLen = maxLength !== undefined ? maxLength : this.maxLength;

        if (this.segments.length < 2) {
            return 0;
        }

        let removed = 0;
        let currentLength = this.getLength();

        while (currentLength > maxLen && this.segments.length > 1) {
            // Update cached segments first
            if (this._isDirty) {
                this._updateCachedSegments();
            }
            
            // Remove first segment
            const removedSegment = this._cachedSegments[0];
            
            if (removedSegment) {
                this._totalLength -= removedSegment.length;
            }

            this.segments.shift();
            removed++;
            currentLength = this.getLength();
        }

        if (removed > 0) {
            this._isDirty = true;
            this._lastUpdate = Date.now();
            this._updateCachedSegments();
        }

        return removed;
    }

    /**
     * Update cached segment data
     * @private
     */
    _updateCachedSegments() {
        this._cachedSegments = [];
        this._totalLength = 0;

        for (let i = 0; i < this.segments.length - 1; i++) {
            const p1 = this.segments[i];
            const p2 = this.segments[i + 1];
            const length = segmentLength(p1.x, p1.z, p2.x, p2.z);

            this._cachedSegments.push({
                x1: p1.x,
                z1: p1.z,
                x2: p2.x,
                z2: p2.z,
                length,
                pid: this.playerId
            });

            this._totalLength += length;
        }

        this._isDirty = false;

        // Rebuild spatial hash if enabled
        if (this._spatialHashEnabled) {
            this._rebuildSpatialHash();
        }
    }

    // ========================================================================
    // SpatialHash Integration
    // ========================================================================

    /**
     * Update spatial hash index
     * Creates or rebuilds the spatial hash for fast proximity queries.
     *
     * @param {SpatialHash} [spatialHash] - External spatial hash to use, or creates internal one
     * @returns {SpatialHash} The spatial hash instance
     */
    updateSpatialHash(spatialHash) {
        if (spatialHash) {
            this._spatialHash = spatialHash;
        } else if (!this._spatialHash) {
            this._spatialHash = new SpatialHash(this.spatialHashCellSize);
        }

        this._spatialHashEnabled = true;
        this._rebuildSpatialHash();

        return this._spatialHash;
    }

    /**
     * Remove trail from spatial hash
     * Removes all segment entries from the spatial hash.
     *
     * @param {SpatialHash} [spatialHash] - Spatial hash to remove from (uses internal if not provided)
     * @returns {boolean} True if removed successfully
     */
    removeFromSpatialHash(spatialHash) {
        const hash = spatialHash || this._spatialHash;

        if (!hash) {
            return false;
        }

        // Remove all segment entries
        for (let i = 0; i < this._cachedSegments.length; i++) {
            hash.remove(`seg_${i}`);
        }

        if (!spatialHash) {
            this._spatialHashEnabled = false;
        }

        return true;
    }

    /**
     * Query nearby trail segments
     * Returns segments within the specified radius.
     *
     * @param {SpatialHash} [spatialHash] - Spatial hash to query (uses internal if not provided)
     * @param {number} x - Center X coordinate
     * @param {number} z - Center Z coordinate
     * @param {number} radius - Query radius
     * @returns {Array<{segment: TrailSegment, distance: number}>} Nearby segments with distances
     */
    getNearbySegments(spatialHash, x, z, radius) {
        const hash = spatialHash || this._spatialHash;

        if (!hash || !this._spatialHashEnabled) {
            // Fallback to brute force if no spatial hash
            return this._bruteForceNearby(x, z, radius);
        }

        const nearby = [];
        const results = hash.queryRange(x, z, radius);

        for (const result of results) {
            // Parse segment index from ID
            const match = result.id.toString().match(/seg_(\d+)/);
            if (match) {
                const index = parseInt(match[1], 10);
                const segment = this.getSegment(index);

                if (segment) {
                    nearby.push({
                        segment,
                        distance: result.distance
                    });
                }
            }
        }

        // Sort by distance
        nearby.sort((a, b) => a.distance - b.distance);

        return nearby;
    }

    /**
     * Rebuild spatial hash from current segments
     * @private
     */
    _rebuildSpatialHash() {
        if (!this._spatialHashEnabled || !this._spatialHash) {
            return;
        }

        this._spatialHash.clear();

        for (let i = 0; i < this.segments.length; i++) {
            const point = this.segments[i];
            this._spatialHash.insert(`seg_${i}`, point.x, point.z);
        }
    }

    /**
     * Brute force nearby segment query (fallback)
     * @private
     */
    _bruteForceNearby(x, z, radius) {
        const nearby = [];
        const segments = this.getSegments();
        const radiusSquared = radius * radius;

        for (const segment of segments) {
            const result = distanceToSegmentWithClosest(x, z, segment.x1, segment.z1, segment.x2, segment.z2);

            if (result.distance <= radius) {
                nearby.push({
                    segment,
                    distance: result.distance
                });
            }
        }

        nearby.sort((a, b) => a.distance - b.distance);
        return nearby;
    }

    // ========================================================================
    // Trail Rendering
    // ========================================================================

    /**
     * Get render data for Three.js
     * Returns data suitable for creating BufferGeometry.
     *
     * @returns {{
     *   positions: Float32Array,
     *   colors: Float32Array,
     *   indices: Uint16Array,
     *   segmentCount: number,
     *   vertexCount: number
     * }}
     */
    getRenderData() {
        const segments = this.getSegments();
        const segmentCount = segments.length;
        const vertexCount = segmentCount * 4; // 4 vertices per segment (quad)

        const positions = new Float32Array(vertexCount * 3); // x, y, z per vertex
        const colors = new Float32Array(vertexCount * 3);
        const indices = new Uint16Array(segmentCount * 6); // 6 indices per segment (2 triangles)

        // Extract RGB from hex color
        const r = ((this.color >> 16) & 0xff) / 255;
        const g = ((this.color >> 8) & 0xff) / 255;
        const b = (this.color & 0xff) / 255;

        const halfWidth = this.width / 2;

        for (let i = 0; i < segmentCount; i++) {
            const seg = segments[i];
            const baseIndex = i * 4;
            const baseVertexIndex = baseIndex * 3;
            const baseColorIndex = baseIndex * 3;

            // Calculate segment direction and perpendicular
            const dx = seg.x2 - seg.x1;
            const dz = seg.z2 - seg.z1;
            const length = Math.sqrt(dx * dx + dz * dz);

            if (length < 0.0001) continue;

            // Normalized direction
            const dirX = dx / length;
            const dirZ = dz / length;

            // Perpendicular (for width)
            const perpX = -dirZ;
            const perpZ = dirX;

            // Four corners of the quad (billboard facing up)
            // Bottom-left
            positions[baseVertexIndex] = seg.x1 - perpX * halfWidth;
            positions[baseVertexIndex + 1] = 0;
            positions[baseVertexIndex + 2] = seg.z1 - perpZ * halfWidth;

            // Bottom-right
            positions[baseVertexIndex + 3] = seg.x1 + perpX * halfWidth;
            positions[baseVertexIndex + 4] = 0;
            positions[baseVertexIndex + 5] = seg.z1 + perpZ * halfWidth;

            // Top-left
            positions[baseVertexIndex + 6] = seg.x1 - perpX * halfWidth;
            positions[baseVertexIndex + 7] = this.height;
            positions[baseVertexIndex + 8] = seg.z1 - perpZ * halfWidth;

            // Top-right
            positions[baseVertexIndex + 9] = seg.x1 + perpX * halfWidth;
            positions[baseVertexIndex + 10] = this.height;
            positions[baseVertexIndex + 11] = seg.z1 + perpZ * halfWidth;

            // Set colors
            colors[baseColorIndex] = r;
            colors[baseColorIndex + 1] = g;
            colors[baseColorIndex + 2] = b;
            colors[baseColorIndex + 3] = r;
            colors[baseColorIndex + 4] = g;
            colors[baseColorIndex + 5] = b;
            colors[baseColorIndex + 6] = r;
            colors[baseColorIndex + 7] = g;
            colors[baseColorIndex + 8] = b;
            colors[baseColorIndex + 9] = r;
            colors[baseColorIndex + 10] = g;
            colors[baseColorIndex + 11] = b;

            // Set indices for two triangles
            const baseIdx = i * 6;
            indices[baseIdx] = baseIndex;
            indices[baseIdx + 1] = baseIndex + 1;
            indices[baseIdx + 2] = baseIndex + 2;
            indices[baseIdx + 3] = baseIndex + 1;
            indices[baseIdx + 4] = baseIndex + 3;
            indices[baseIdx + 5] = baseIndex + 2;
        }

        return {
            positions,
            colors,
            indices,
            segmentCount,
            vertexCount
        };
    }

    /**
     * Update Three.js mesh with current trail data
     *
     * @param {THREE.Mesh} mesh - Three.js mesh to update
     * @returns {boolean} True if updated successfully
     */
    updateRenderMesh(mesh) {
        if (!mesh || !mesh.geometry) {
            return false;
        }

        const renderData = this.getRenderData();

        if (renderData.vertexCount === 0) {
            return false;
        }

        // Update or create attributes
        let positionAttr = mesh.geometry.getAttribute('position');
        let colorAttr = mesh.geometry.getAttribute('color');
        let indexAttr = mesh.geometry.index;

        // Check if Three.js is available
        const THREE = window.THREE;
        if (!THREE) {
            return false;
        }

        // Create or update position attribute
        if (!positionAttr || positionAttr.count < renderData.vertexCount) {
            positionAttr = new THREE.BufferAttribute(renderData.positions, 3);
            mesh.geometry.setAttribute('position', positionAttr);
        } else {
            positionAttr.set(renderData.positions);
            positionAttr.needsUpdate = true;
        }

        // Create or update color attribute
        if (!colorAttr || colorAttr.count < renderData.vertexCount) {
            colorAttr = new THREE.BufferAttribute(renderData.colors, 3);
            mesh.geometry.setAttribute('color', colorAttr);
        } else {
            colorAttr.set(renderData.colors);
            colorAttr.needsUpdate = true;
        }

        // Create or update index
        if (!indexAttr || indexAttr.count < renderData.indices.length) {
            indexAttr = new THREE.BufferAttribute(renderData.indices, 1);
            mesh.geometry.setIndex(indexAttr);
        } else {
            indexAttr.set(renderData.indices);
            indexAttr.needsUpdate = true;
        }

        // Update draw range
        mesh.geometry.setDrawRange(0, renderData.indices.length);

        return true;
    }

    /**
     * Create trail geometry
     * Creates a new Three.js BufferGeometry for the trail.
     *
     * @returns {THREE.BufferGeometry|null} New geometry or null if Three.js not available
     */
    createTrailGeometry() {
        const THREE = window.THREE;
        
        // Check if Three.js is properly available
        if (!THREE || !THREE.BufferGeometry || !THREE.BufferAttribute) {
            console.warn('Three.js not available, cannot create trail geometry');
            return null;
        }

        const geometry = new THREE.BufferGeometry();
        const renderData = this.getRenderData();

        if (renderData.vertexCount > 0) {
            geometry.setAttribute('position', new THREE.BufferAttribute(renderData.positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(renderData.colors, 3));
            geometry.setIndex(new THREE.BufferAttribute(renderData.indices, 1));
        }

        return geometry;
    }

    // ========================================================================
    // Collision Integration
    // ========================================================================

    /**
     * Get segments for collision detection
     * Returns segments in a format suitable for collision detection functions.
     *
     * @returns {Array<{x1: number, z1: number, x2: number, z2: number, pid: string}>}
     */
    getCollisionSegments() {
        return this.getSegments();
    }

    /**
     * Check if a point is near the trail
     *
     * @param {number} x - Point X coordinate
     * @param {number} z - Point Z coordinate
     * @param {number} radius - Check radius
     * @returns {{near: boolean, distance: number, closestSegment: TrailSegment|null}}
     */
    isPointNearTrail(x, z, radius) {
        const segments = this.getSegments();
        let minDistance = Infinity;
        let closestSegment = null;

        for (const segment of segments) {
            const result = distanceToSegmentWithClosest(x, z, segment.x1, segment.z1, segment.x2, segment.z2);

            if (result.distance < minDistance) {
                minDistance = result.distance;
                closestSegment = segment;
            }
        }

        return {
            near: minDistance <= radius,
            distance: minDistance,
            closestSegment
        };
    }

    /**
     * Find the closest segment to a point
     *
     * @param {number} x - Point X coordinate
     * @param {number} z - Point Z coordinate
     * @returns {{segment: TrailSegment|null, distance: number, closestX: number, closestZ: number, t: number}}
     */
    getClosestSegment(x, z) {
        const segments = this.getSegments();

        if (segments.length === 0) {
            return {
                segment: null,
                distance: Infinity,
                closestX: x,
                closestZ: z,
                t: 0
            };
        }

        let minDistance = Infinity;
        let closestSegment = null;
        let closestPoint = { x, z };
        let closestT = 0;

        for (const segment of segments) {
            const result = distanceToSegmentWithClosest(x, z, segment.x1, segment.z1, segment.x2, segment.z2);

            if (result.distance < minDistance) {
                minDistance = result.distance;
                closestSegment = segment;
                closestPoint = { x: result.closestX, z: result.closestZ };
                closestT = result.t;
            }
        }

        return {
            segment: closestSegment,
            distance: minDistance,
            closestX: closestPoint.x,
            closestZ: closestPoint.z,
            t: closestT
        };
    }

    // ========================================================================
    // Length Management
    // ========================================================================

    /**
     * Get total trail length
     *
     * @returns {number} Total length in units
     */
    getLength() {
        if (this._isDirty) {
            this._updateCachedSegments();
        }
        return this._totalLength;
    }

    /**
     * Calculate individual segment length
     *
     * @param {number} index - Segment index
     * @returns {number} Segment length or 0 if invalid index
     */
    calculateSegmentLength(index) {
        if (this._isDirty) {
            this._updateCachedSegments();
        }

        if (index < 0 || index >= this._cachedSegments.length) {
            return 0;
        }

        return this._cachedSegments[index].length;
    }

    /**
     * Enforce maximum length constraint
     * Removes oldest segments until trail is within max length.
     *
     * @param {number} [maxLength] - Maximum length (uses instance maxLength if not provided)
     * @returns {boolean} True if segments were removed
     */
    enforceMaxLength(maxLength) {
        const maxLen = maxLength !== undefined ? maxLength : this.maxLength;

        // Use getLength() to ensure we have the current length
        const currentLength = this.getLength();

        if (currentLength <= maxLen) {
            return false;
        }

        const removed = this.trimToLength(maxLen);
        return removed > 0;
    }

    // ========================================================================
    // Serialization
    // ========================================================================

    /**
     * Serialize trail for network transmission
     * Returns compact representation with only essential data.
     *
     * @returns {{
     *   playerId: string,
     *   segments: Array<{x: number, z: number}>,
     *   length: number,
     *   color: number
     * }}
     */
    toJSON() {
        return {
            playerId: this.playerId,
            segments: [...this.segments],
            length: this.getLength(),
            color: this.color
        };
    }

    /**
     * Deserialize trail from network data
     *
     * @param {{
     *   playerId?: string,
     *   segments?: Array<{x: number, z: number}>,
     *   length?: number,
     *   color?: number
     * }} data - Network data
     * @returns {boolean} True if deserialized successfully
     */
    fromJSON(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        if (data.playerId !== undefined) {
            this.playerId = data.playerId;
        }

        if (data.segments !== undefined && Array.isArray(data.segments)) {
            this.segments = data.segments.map(p => ({ x: p.x, z: p.z }));
            this._isDirty = true;
        }

        if (data.color !== undefined) {
            this.color = data.color;
        }

        if (data.length !== undefined) {
            this._totalLength = data.length;
        }

        this._lastUpdate = Date.now();
        this._updateCachedSegments();

        return true;
    }

    /**
     * Full export with metadata
     * Includes all configuration and state for complete serialization.
     *
     * @returns {{
     *   type: string,
     *   version: number,
     *   playerId: string,
     *   segments: Array<{x: number, z: number}>,
     *   color: number,
     *   maxLength: number,
     *   height: number,
     *   width: number,
     *   minPointSpacing: number,
     *   totalLength: number,
     *   timestamp: number
     * }}
     */
    export() {
        return {
            type: 'TrailEntity',
            version: 1,
            playerId: this.playerId,
            segments: [...this.segments],
            color: this.color,
            maxLength: this.maxLength,
            height: this.height,
            width: this.width,
            minPointSpacing: this.minPointSpacing,
            totalLength: this.getLength(),
            timestamp: this._lastUpdate
        };
    }

    /**
     * Import from full export
     *
     * @param {{
     *   type?: string,
     *   version?: number,
     *   playerId?: string,
     *   segments?: Array<{x: number, z: number}>,
     *   color?: number,
     *   maxLength?: number,
     *   height?: number,
     *   width?: number,
     *   minPointSpacing?: number
     * }} data - Export data
     * @returns {boolean} True if imported successfully
     */
    import(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Validate type
        if (data.type && data.type !== 'TrailEntity') {
            console.warn('Invalid export type:', data.type);
            return false;
        }

        if (data.playerId !== undefined) {
            this.playerId = data.playerId;
        }

        if (data.segments !== undefined && Array.isArray(data.segments)) {
            this.segments = data.segments.map(p => ({ x: p.x, z: p.z }));
        }

        if (data.color !== undefined) {
            this.color = data.color;
        }

        if (data.maxLength !== undefined) {
            this.maxLength = data.maxLength;
        }

        if (data.height !== undefined) {
            this.height = data.height;
        }

        if (data.width !== undefined) {
            this.width = data.width;
        }

        if (data.minPointSpacing !== undefined) {
            this.minPointSpacing = data.minPointSpacing;
        }

        this._isDirty = true;
        this._lastUpdate = Date.now();
        this._updateCachedSegments();

        return true;
    }

    // ========================================================================
    // Utility Methods
    // ========================================================================

    /**
     * Get the first point of the trail
     *
     * @returns {{x: number, z: number}|null} First point or null if empty
     */
    getStartPoint() {
        return this.segments.length > 0 ? { ...this.segments[0] } : null;
    }

    /**
     * Get the last point of the trail
     *
     * @returns {{x: number, z: number}|null} Last point or null if empty
     */
    getEndPoint() {
        return this.segments.length > 0 ? { ...this.segments[this.segments.length - 1] } : null;
    }

    /**
     * Check if trail is empty
     *
     * @returns {boolean} True if no segments
     */
    isEmpty() {
        return this.segments.length < 2;
    }

    /**
     * Get trail bounds (bounding box)
     *
     * @returns {{minX: number, minZ: number, maxX: number, maxZ: number}|null}
     */
    getBounds() {
        if (this.segments.length === 0) {
            return null;
        }

        let minX = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxZ = -Infinity;

        for (const point of this.segments) {
            if (point.x < minX) minX = point.x;
            if (point.z < minZ) minZ = point.z;
            if (point.x > maxX) maxX = point.x;
            if (point.z > maxZ) maxZ = point.z;
        }

        return { minX, minZ, maxX, maxZ };
    }

    /**
     * Get last update timestamp
     *
     * @returns {number} Timestamp in milliseconds
     */
    getLastUpdate() {
        return this._lastUpdate;
    }

    /**
     * Check if trail data has changed since last query
     *
     * @returns {boolean} True if dirty
     */
    isDirty() {
        return this._isDirty;
    }

    /**
     * Get debug information
     *
     * @returns {{
     *   playerId: string,
     *   segmentCount: number,
     *   pointCount: number,
     *   totalLength: number,
     *   maxLength: number,
     *   color: string,
     *   isDirty: boolean,
     *   spatialHashEnabled: boolean
     * }}
     */
    getDebugInfo() {
        return {
            playerId: this.playerId,
            segmentCount: this.segmentCount(),
            pointCount: this.segments.length,
            totalLength: this.getLength(),
            maxLength: this.maxLength,
            color: '0x' + this.color.toString(16).padStart(6, '0'),
            isDirty: this._isDirty,
            spatialHashEnabled: this._spatialHashEnabled
        };
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new TrailEntity
 * Convenience factory function.
 *
 * @param {string} playerId - Player ID
 * @param {Object} [options] - Options
 * @returns {TrailEntity}
 */
export function createTrailEntity(playerId, options = {}) {
    return new TrailEntity(playerId, options);
}

// ============================================================================
// Default Export
// ============================================================================

export default TrailEntity;
