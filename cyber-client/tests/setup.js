/**
 * Test Setup File for Cyber Cycles
 *
 * This file runs before each test suite and sets up the testing environment.
 */

// Mock Three.js for testing (since we're in jsdom, not a real browser)
global.THREE = {
  Scene: class Scene {},
  PerspectiveCamera: class PerspectiveCamera {},
  WebGLRenderer: class WebGLRenderer {},
  Fog: class Fog {},
  AmbientLight: class AmbientLight {},
  Points: class Points {},
  Mesh: class Mesh {},
  BufferGeometry: class BufferGeometry {
    constructor() {
      this.attributes = {};
      this.index = null;
    }
    setAttribute(name, attribute) {
      this.attributes[name] = attribute;
      return this;
    }
    getAttribute(name) {
      return this.attributes[name];
    }
    setIndex(index) {
      this.index = index;
      return this;
    }
  },
  Float32BufferAttribute: class Float32BufferAttribute {},
  PointsMaterial: class PointsMaterial {},
  MeshBasicMaterial: class MeshBasicMaterial {},
  PlaneGeometry: class PlaneGeometry {},
  RingGeometry: class RingGeometry {},
  BoxGeometry: class BoxGeometry {},
  LineBasicMaterial: class LineBasicMaterial {},
  LineSegments: class LineSegments {},
  BufferAttribute: class BufferAttribute {
    constructor(array, itemSize) {
      this.array = array;
      this.itemSize = itemSize;
    }
  },
  AdditiveBlending: 2,
  DoubleSide: 3,
  CanvasTexture: class CanvasTexture {}
};

// Mock localStorage for testing
const localStorageMock = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = String(value);
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

global.localStorage = localStorageMock;

// Mock console.error to suppress expected warnings during tests
const originalConsoleError = console.error;
console.error = function(...args) {
  // Filter out specific warnings if needed
  // originalConsoleError.apply(console, args);
};

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
});
