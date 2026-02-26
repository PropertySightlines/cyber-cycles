# Cyber Cycles Physics Benchmarks - Benchmark Report

**Generated:** 2026-02-25T13:07:53.330Z

## Test Environment

| Property | Value |
|----------|-------|
| Platform | Node.js |
| Timestamp | 2026-02-25T13:07:43.450Z |

## Summary

| Benchmark | Iterations | Min (ms) | Max (ms) | Avg (ms) | Median (ms) | P95 (ms) | P99 (ms) |
|-----------|------------|----------|----------|----------|-------------|----------|----------|
| SpatialHash: Insert 100 entities | 500 | 0.025 | 0.316 | 0.033 | 0.027 | 0.059 | 0.143 |
| SpatialHash: Insert 1000 entities | 100 | 0.266 | 0.911 | 0.395 | 0.366 | 0.802 | 0.906 |
| SpatialHash: Insert 10000 entities | 20 | 4.042 | 14.715 | 6.084 | 5.543 | 10.068 | 13.786 |
| SpatialHash: Query 100 entities (radius=10) | 1000 | 0.026 | 6.305 | 0.047 | 0.029 | 0.051 | 0.083 |
| SpatialHash: Query 1000 entities (radius=10) | 500 | 0.277 | 4.715 | 0.382 | 0.321 | 0.508 | 1.223 |
| SpatialHash: Query 10000 entities (radius=10) | 100 | 3.934 | 23.758 | 6.097 | 5.691 | 9.674 | 15.326 |
| SpatialHash: Query IDs 1000 entities | 1000 | 0.269 | 8.441 | 0.374 | 0.302 | 0.484 | 1.100 |
| SpatialHash: Update 100 entities | 500 | 0.045 | 0.615 | 0.059 | 0.054 | 0.073 | 0.090 |
| SpatialHash: Update 1000 entities | 100 | 0.332 | 1.182 | 0.472 | 0.409 | 0.670 | 1.075 |
| SpatialHash: Remove 100 entities | 500 | 0.038 | 0.654 | 0.061 | 0.064 | 0.089 | 0.106 |
| CollisionDetection: distanceToSegment (basic) | 10000 | 0.000 | 0.571 | 0.001 | 0.001 | 0.001 | 0.002 |
| CollisionDetection: distanceToSegmentWithClosest | 10000 | 0.000 | 0.062 | 0.001 | 0.001 | 0.001 | 0.002 |
| CollisionDetection: distanceToSegmentSquared | 10000 | 0.000 | 3.444 | 0.001 | 0.001 | 0.001 | 0.001 |
| CollisionDetection: distanceToSegment (100 segments) | 1000 | 0.006 | 4.257 | 0.020 | 0.011 | 0.048 | 0.063 |
| CollisionDetection: distanceToSegment (1000 segments) | 200 | 0.093 | 0.708 | 0.112 | 0.100 | 0.120 | 0.616 |
| CollisionDetection: lineSegmentIntersection (basic) | 10000 | 0.000 | 1.326 | 0.001 | 0.000 | 0.001 | 0.002 |
| CollisionDetection: lineSegmentIntersection (parallel) | 10000 | 0.000 | 0.475 | 0.000 | 0.000 | 0.000 | 0.001 |
| CollisionDetection: intersection vs 100 segments | 1000 | 0.008 | 2.009 | 0.023 | 0.013 | 0.057 | 0.071 |
| CollisionDetection: continuousCollisionCheck (10 segments) | 2000 | 0.001 | 7.936 | 0.008 | 0.003 | 0.006 | 0.009 |
| CollisionDetection: continuousCollisionCheck (100 segments) | 500 | 0.009 | 0.488 | 0.013 | 0.011 | 0.017 | 0.020 |
| CollisionDetection: checkTrailCollision | 1000 | 0.007 | 0.464 | 0.011 | 0.007 | 0.031 | 0.042 |
| CollisionDetection: checkBikeCollision (10 players) | 2000 | 0.001 | 0.454 | 0.006 | 0.005 | 0.011 | 0.024 |
| CollisionDetection: checkBikeCollision (50 players) | 500 | 0.007 | 0.634 | 0.012 | 0.010 | 0.013 | 0.043 |
| CollisionDetection: checkArenaBounds (inside) | 10000 | 0.000 | 1.117 | 0.001 | 0.000 | 0.001 | 0.001 |
| CollisionDetection: checkArenaBounds (outside) | 10000 | 0.000 | 1.863 | 0.001 | 0.000 | 0.001 | 0.002 |
| CollisionDetection: isPointNearSegment | 10000 | 0.000 | 0.733 | 0.000 | 0.000 | 0.001 | 0.001 |
| RubberSystem: Create RubberState | 10000 | 0.000 | 0.068 | 0.000 | 0.000 | 0.001 | 0.001 |
| RubberSystem: updateRubber | 10000 | 0.000 | 3.101 | 0.001 | 0.001 | 0.001 | 0.002 |
| RubberSystem: applyMalus | 10000 | 0.000 | 1.921 | 0.001 | 0.000 | 0.001 | 0.001 |
| RubberSystem: calculateEffectiveness | 10000 | 0.000 | 0.931 | 0.000 | 0.000 | 0.000 | 0.001 |
| RubberSystem: consumeRubber | 10000 | 0.000 | 0.064 | 0.000 | 0.000 | 0.001 | 0.001 |
| RubberSystem: regenerateRubber | 10000 | 0.000 | 1.608 | 0.001 | 0.000 | 0.000 | 0.001 |
| RubberSystem: detectWallProximity (10 segments) | 2000 | 0.001 | 0.838 | 0.006 | 0.007 | 0.008 | 0.012 |
| RubberSystem: detectWallProximity (100 segments) | 500 | 0.010 | 0.621 | 0.014 | 0.012 | 0.014 | 0.023 |
| RubberSystem: calculateWallDistance (100 segments) | 1000 | 0.010 | 2.665 | 0.015 | 0.011 | 0.014 | 0.035 |
| RubberSystem: isNearWall (100 segments) | 2000 | 0.005 | 0.513 | 0.008 | 0.007 | 0.010 | 0.014 |
| RubberSystem: calculateSpeedAdjustment | 1000 | 0.004 | 0.469 | 0.007 | 0.004 | 0.030 | 0.035 |
| RubberSystem: applyRubberCollision | 500 | 0.008 | 0.620 | 0.023 | 0.014 | 0.036 | 0.056 |
| EntityManager: Create 100 entities | 500 | 0.066 | 0.859 | 0.118 | 0.124 | 0.175 | 0.235 |
| EntityManager: Create 1000 entities | 100 | 0.684 | 2.044 | 0.919 | 0.754 | 1.595 | 1.969 |
| EntityManager: Create 10000 entities | 20 | 12.279 | 30.611 | 21.018 | 20.220 | 29.980 | 30.485 |
| EntityManager: Update 100 entities | 500 | 0.084 | 5.870 | 0.128 | 0.090 | 0.180 | 0.462 |
| EntityManager: Query by type (1000 entities) | 500 | 0.589 | 5.369 | 0.884 | 0.671 | 1.410 | 2.267 |
| EntityManager: Query by component (1000 entities) | 500 | 1.041 | 3.407 | 1.563 | 1.278 | 2.656 | 2.894 |
| EntityManager: Query AND (position + velocity) | 500 | 1.167 | 6.791 | 1.773 | 1.564 | 2.877 | 3.843 |
| EntityManager: Destroy 100 entities | 500 | 0.077 | 2.061 | 0.117 | 0.086 | 0.172 | 0.654 |
| EntityManager: Clear 1000 entities | 100 | 0.653 | 2.226 | 1.007 | 0.960 | 1.695 | 2.099 |

## Detailed Results

### SpatialHash: Insert 100 entities

Insert 100 entities into SpatialHash

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 16.78ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.025 ms |
| Max | 0.316 ms |
| Average | 0.033 ms |
| Median | 0.027 ms |
| P95 | 0.059 ms |
| P99 | 0.143 ms |
| Std Dev | 0.024 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.02, 0.32] ms

0.02 - 0.05 | ######################################## (462)
0.05 - 0.08 | ## (24)
0.08 - 0.11 |  (0)
0.11 - 0.14 | # (8)
0.14 - 0.17 |  (3)
0.17 - 0.20 |  (1)
0.20 - 0.23 |  (1)
0.23 - 0.26 |  (0)
0.26 - 0.29 |  (0)
0.29 - 0.32 |  (1)
```


### SpatialHash: Insert 1000 entities

Insert 1000 entities into SpatialHash

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 39.84ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 0.266 ms |
| Max | 0.911 ms |
| Average | 0.395 ms |
| Median | 0.366 ms |
| P95 | 0.802 ms |
| P99 | 0.906 ms |
| Std Dev | 0.143 ms |
| Variance | 0.020 |

**Distribution (ASCII Histogram):**

```
Range: [0.27, 0.91] ms

0.27 - 0.33 | ######################################## (35)
0.33 - 0.40 | ###################################### (33)
0.40 - 0.46 | ##################### (18)
0.46 - 0.52 | ## (2)
0.52 - 0.59 | ### (3)
0.59 - 0.65 | ## (2)
0.65 - 0.72 |  (0)
0.72 - 0.78 |  (0)
0.78 - 0.85 | ##### (4)
0.85 - 0.91 | ### (3)
```


### SpatialHash: Insert 10000 entities

Insert 10000 entities into SpatialHash

**Configuration:**
- Iterations: 20
- Warmup: 100
- Total Duration: 121.84ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 20 |
| Min | 4.042 ms |
| Max | 14.715 ms |
| Average | 6.084 ms |
| Median | 5.543 ms |
| P95 | 10.068 ms |
| P99 | 13.786 ms |
| Std Dev | 2.543 ms |
| Variance | 6.467 |

**Distribution (ASCII Histogram):**

```
Range: [4.04, 14.72] ms

4.04 - 5.11 | ######################################## (9)
5.11 - 6.18 | ############# (3)
6.18 - 7.24 | ###################### (5)
7.24 - 8.31 |  (0)
8.31 - 9.38 | #### (1)
9.38 - 10.45 | #### (1)
10.45 - 11.51 |  (0)
11.51 - 12.58 |  (0)
12.58 - 13.65 |  (0)
13.65 - 14.72 | #### (1)
```


### SpatialHash: Query 100 entities (radius=10)

Query range with 100 entities

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 47.11ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.026 ms |
| Max | 6.305 ms |
| Average | 0.047 ms |
| Median | 0.029 ms |
| P95 | 0.051 ms |
| P99 | 0.083 ms |
| Std Dev | 0.216 ms |
| Variance | 0.047 |

**Distribution (ASCII Histogram):**

```
Range: [0.03, 6.31] ms

0.03 - 0.65 | ######################################## (997)
0.65 - 1.28 |  (0)
1.28 - 1.91 |  (1)
1.91 - 2.54 |  (1)
2.54 - 3.17 |  (0)
3.17 - 3.79 |  (0)
3.79 - 4.42 |  (0)
4.42 - 5.05 |  (0)
5.05 - 5.68 |  (0)
5.68 - 6.31 |  (1)
```


### SpatialHash: Query 1000 entities (radius=10)

Query range with 1000 entities

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 191.28ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.277 ms |
| Max | 4.715 ms |
| Average | 0.382 ms |
| Median | 0.321 ms |
| P95 | 0.508 ms |
| P99 | 1.223 ms |
| Std Dev | 0.240 ms |
| Variance | 0.058 |

**Distribution (ASCII Histogram):**

```
Range: [0.28, 4.72] ms

0.28 - 0.72 | ######################################## (486)
0.72 - 1.16 | # (8)
1.16 - 1.61 |  (5)
1.61 - 2.05 |  (0)
2.05 - 2.50 |  (0)
2.50 - 2.94 |  (0)
2.94 - 3.38 |  (0)
3.38 - 3.83 |  (0)
3.83 - 4.27 |  (0)
4.27 - 4.72 |  (1)
```


### SpatialHash: Query 10000 entities (radius=10)

Query range with 10000 entities

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 610.35ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 3.934 ms |
| Max | 23.758 ms |
| Average | 6.097 ms |
| Median | 5.691 ms |
| P95 | 9.674 ms |
| P99 | 15.326 ms |
| Std Dev | 2.857 ms |
| Variance | 8.161 |

**Distribution (ASCII Histogram):**

```
Range: [3.93, 23.76] ms

3.93 - 5.92 | ######################################## (53)
5.92 - 7.90 | ########################## (34)
7.90 - 9.88 | ###### (8)
9.88 - 11.86 |  (0)
11.86 - 13.85 | # (1)
13.85 - 15.83 | ## (3)
15.83 - 17.81 |  (0)
17.81 - 19.79 |  (0)
19.79 - 21.78 |  (0)
21.78 - 23.76 | # (1)
```


### SpatialHash: Query IDs 1000 entities

Query IDs only (no distance calc)

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 374.87ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.269 ms |
| Max | 8.441 ms |
| Average | 0.374 ms |
| Median | 0.302 ms |
| P95 | 0.484 ms |
| P99 | 1.100 ms |
| Std Dev | 0.340 ms |
| Variance | 0.115 |

**Distribution (ASCII Histogram):**

```
Range: [0.27, 8.44] ms

0.27 - 1.09 | ######################################## (989)
1.09 - 1.90 |  (8)
1.90 - 2.72 |  (0)
2.72 - 3.54 |  (0)
3.54 - 4.35 |  (0)
4.35 - 5.17 |  (2)
5.17 - 5.99 |  (0)
5.99 - 6.81 |  (0)
6.81 - 7.62 |  (0)
7.62 - 8.44 |  (1)
```


### SpatialHash: Update 100 entities

Update positions of 100 entities

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 29.59ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.045 ms |
| Max | 0.615 ms |
| Average | 0.059 ms |
| Median | 0.054 ms |
| P95 | 0.073 ms |
| P99 | 0.090 ms |
| Std Dev | 0.035 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.05, 0.61] ms

0.05 - 0.10 | ######################################## (496)
0.10 - 0.16 |  (1)
0.16 - 0.22 |  (1)
0.22 - 0.27 |  (0)
0.27 - 0.33 |  (0)
0.33 - 0.39 |  (0)
0.39 - 0.44 |  (0)
0.44 - 0.50 |  (0)
0.50 - 0.56 |  (1)
0.56 - 0.61 |  (1)
```


### SpatialHash: Update 1000 entities

Update positions of 1000 entities

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 47.32ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 0.332 ms |
| Max | 1.182 ms |
| Average | 0.472 ms |
| Median | 0.409 ms |
| P95 | 0.670 ms |
| P99 | 1.075 ms |
| Std Dev | 0.155 ms |
| Variance | 0.024 |

**Distribution (ASCII Histogram):**

```
Range: [0.33, 1.18] ms

0.33 - 0.42 | ######################################## (53)
0.42 - 0.50 | ### (4)
0.50 - 0.59 | ####################### (31)
0.59 - 0.67 | ##### (7)
0.67 - 0.76 |  (0)
0.76 - 0.84 |  (0)
0.84 - 0.93 | ## (3)
0.93 - 1.01 |  (0)
1.01 - 1.10 | # (1)
1.10 - 1.18 | # (1)
```


### SpatialHash: Remove 100 entities

Remove 100 entities

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 30.69ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.038 ms |
| Max | 0.654 ms |
| Average | 0.061 ms |
| Median | 0.064 ms |
| P95 | 0.089 ms |
| P99 | 0.106 ms |
| Std Dev | 0.039 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.04, 0.65] ms

0.04 - 0.10 | ######################################## (491)
0.10 - 0.16 |  (6)
0.16 - 0.22 |  (1)
0.22 - 0.28 |  (0)
0.28 - 0.35 |  (0)
0.35 - 0.41 |  (0)
0.41 - 0.47 |  (0)
0.47 - 0.53 |  (1)
0.53 - 0.59 |  (0)
0.59 - 0.65 |  (1)
```


### CollisionDetection: distanceToSegment (basic)

Basic point to segment distance

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 10.13ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.571 ms |
| Average | 0.001 ms |
| Median | 0.001 ms |
| P95 | 0.001 ms |
| P99 | 0.002 ms |
| Std Dev | 0.006 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.57] ms

0.00 - 0.06 | ######################################## (9998)
0.06 - 0.11 |  (1)
0.11 - 0.17 |  (0)
0.17 - 0.23 |  (0)
0.23 - 0.29 |  (0)
0.29 - 0.34 |  (0)
0.34 - 0.40 |  (0)
0.40 - 0.46 |  (0)
0.46 - 0.51 |  (0)
0.51 - 0.57 |  (1)
```


### CollisionDetection: distanceToSegmentWithClosest

Distance with closest point calculation

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 8.87ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.062 ms |
| Average | 0.001 ms |
| Median | 0.001 ms |
| P95 | 0.001 ms |
| P99 | 0.002 ms |
| Std Dev | 0.001 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.06] ms

0.00 - 0.01 | ######################################## (9984)
0.01 - 0.01 |  (6)
0.01 - 0.02 |  (4)
0.02 - 0.03 |  (1)
0.03 - 0.03 |  (2)
0.03 - 0.04 |  (1)
0.04 - 0.04 |  (1)
0.04 - 0.05 |  (0)
0.05 - 0.06 |  (0)
0.06 - 0.06 |  (1)
```


### CollisionDetection: distanceToSegmentSquared

Squared distance (no sqrt)

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 12.90ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 3.444 ms |
| Average | 0.001 ms |
| Median | 0.001 ms |
| P95 | 0.001 ms |
| P99 | 0.001 ms |
| Std Dev | 0.035 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 3.44] ms

0.00 - 0.34 | ######################################## (9998)
0.34 - 0.69 |  (0)
0.69 - 1.03 |  (1)
1.03 - 1.38 |  (0)
1.38 - 1.72 |  (0)
1.72 - 2.07 |  (0)
2.07 - 2.41 |  (0)
2.41 - 2.76 |  (0)
2.76 - 3.10 |  (0)
3.10 - 3.44 |  (1)
```


### CollisionDetection: distanceToSegment (100 segments)

Distance to 100 segments

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 20.27ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.006 ms |
| Max | 4.257 ms |
| Average | 0.020 ms |
| Median | 0.011 ms |
| P95 | 0.048 ms |
| P99 | 0.063 ms |
| Std Dev | 0.135 ms |
| Variance | 0.018 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 4.26] ms

0.01 - 0.43 | ######################################## (999)
0.43 - 0.86 |  (0)
0.86 - 1.28 |  (0)
1.28 - 1.71 |  (0)
1.71 - 2.13 |  (0)
2.13 - 2.56 |  (0)
2.56 - 2.98 |  (0)
2.98 - 3.41 |  (0)
3.41 - 3.83 |  (0)
3.83 - 4.26 |  (1)
```


### CollisionDetection: distanceToSegment (1000 segments)

Distance to 1000 segments

**Configuration:**
- Iterations: 200
- Warmup: 100
- Total Duration: 22.43ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 200 |
| Min | 0.093 ms |
| Max | 0.708 ms |
| Average | 0.112 ms |
| Median | 0.100 ms |
| P95 | 0.120 ms |
| P99 | 0.616 ms |
| Std Dev | 0.070 ms |
| Variance | 0.005 |

**Distribution (ASCII Histogram):**

```
Range: [0.09, 0.71] ms

0.09 - 0.15 | ######################################## (196)
0.15 - 0.22 |  (1)
0.22 - 0.28 |  (0)
0.28 - 0.34 |  (0)
0.34 - 0.40 |  (0)
0.40 - 0.46 |  (0)
0.46 - 0.52 |  (0)
0.52 - 0.58 |  (0)
0.58 - 0.65 |  (1)
0.65 - 0.71 |  (2)
```


### CollisionDetection: lineSegmentIntersection (basic)

Basic line segment intersection

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 7.60ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 1.326 ms |
| Average | 0.001 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.002 ms |
| Std Dev | 0.013 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.33] ms

0.00 - 0.13 | ######################################## (9999)
0.13 - 0.27 |  (0)
0.27 - 0.40 |  (0)
0.40 - 0.53 |  (0)
0.53 - 0.66 |  (0)
0.66 - 0.80 |  (0)
0.80 - 0.93 |  (0)
0.93 - 1.06 |  (0)
1.06 - 1.19 |  (0)
1.19 - 1.33 |  (1)
```


### CollisionDetection: lineSegmentIntersection (parallel)

Parallel lines intersection test

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 3.80ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.475 ms |
| Average | 0.000 ms |
| Median | 0.000 ms |
| P95 | 0.000 ms |
| P99 | 0.001 ms |
| Std Dev | 0.005 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.47] ms

0.00 - 0.05 | ######################################## (9999)
0.05 - 0.10 |  (0)
0.10 - 0.14 |  (0)
0.14 - 0.19 |  (0)
0.19 - 0.24 |  (0)
0.24 - 0.28 |  (0)
0.28 - 0.33 |  (0)
0.33 - 0.38 |  (0)
0.38 - 0.43 |  (0)
0.43 - 0.47 |  (1)
```


### CollisionDetection: intersection vs 100 segments

Intersection test with 100 segments

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 23.11ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.008 ms |
| Max | 2.009 ms |
| Average | 0.023 ms |
| Median | 0.013 ms |
| P95 | 0.057 ms |
| P99 | 0.071 ms |
| Std Dev | 0.074 ms |
| Variance | 0.005 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 2.01] ms

0.01 - 0.21 | ######################################## (996)
0.21 - 0.41 |  (0)
0.41 - 0.61 |  (0)
0.61 - 0.81 |  (3)
0.81 - 1.01 |  (0)
1.01 - 1.21 |  (0)
1.21 - 1.41 |  (0)
1.41 - 1.61 |  (0)
1.61 - 1.81 |  (0)
1.81 - 2.01 |  (1)
```


### CollisionDetection: continuousCollisionCheck (10 segments)

CCD with 10 segments

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 16.09ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.001 ms |
| Max | 7.936 ms |
| Average | 0.008 ms |
| Median | 0.003 ms |
| P95 | 0.006 ms |
| P99 | 0.009 ms |
| Std Dev | 0.178 ms |
| Variance | 0.032 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 7.94] ms

0.00 - 0.79 | ######################################## (1999)
0.79 - 1.59 |  (0)
1.59 - 2.38 |  (0)
2.38 - 3.17 |  (0)
3.17 - 3.97 |  (0)
3.97 - 4.76 |  (0)
4.76 - 5.56 |  (0)
5.56 - 6.35 |  (0)
6.35 - 7.14 |  (0)
7.14 - 7.94 |  (1)
```


### CollisionDetection: continuousCollisionCheck (100 segments)

CCD with 100 segments

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 6.47ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.009 ms |
| Max | 0.488 ms |
| Average | 0.013 ms |
| Median | 0.011 ms |
| P95 | 0.017 ms |
| P99 | 0.020 ms |
| Std Dev | 0.021 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 0.49] ms

0.01 - 0.06 | ######################################## (499)
0.06 - 0.11 |  (0)
0.11 - 0.15 |  (0)
0.15 - 0.20 |  (0)
0.20 - 0.25 |  (0)
0.25 - 0.30 |  (0)
0.30 - 0.34 |  (0)
0.34 - 0.39 |  (0)
0.39 - 0.44 |  (0)
0.44 - 0.49 |  (1)
```


### CollisionDetection: checkTrailCollision

Trail collision check

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 11.31ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.007 ms |
| Max | 0.464 ms |
| Average | 0.011 ms |
| Median | 0.007 ms |
| P95 | 0.031 ms |
| P99 | 0.042 ms |
| Std Dev | 0.017 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 0.46] ms

0.01 - 0.05 | ######################################## (991)
0.05 - 0.10 |  (8)
0.10 - 0.14 |  (0)
0.14 - 0.19 |  (0)
0.19 - 0.24 |  (0)
0.24 - 0.28 |  (0)
0.28 - 0.33 |  (0)
0.33 - 0.37 |  (0)
0.37 - 0.42 |  (0)
0.42 - 0.46 |  (1)
```


### CollisionDetection: checkBikeCollision (10 players)

Bike collision with 10 players

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 11.75ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.001 ms |
| Max | 0.454 ms |
| Average | 0.006 ms |
| Median | 0.005 ms |
| P95 | 0.011 ms |
| P99 | 0.024 ms |
| Std Dev | 0.012 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.45] ms

0.00 - 0.05 | ######################################## (1991)
0.05 - 0.09 |  (8)
0.09 - 0.14 |  (0)
0.14 - 0.18 |  (0)
0.18 - 0.23 |  (0)
0.23 - 0.27 |  (0)
0.27 - 0.32 |  (0)
0.32 - 0.36 |  (0)
0.36 - 0.41 |  (0)
0.41 - 0.45 |  (1)
```


### CollisionDetection: checkBikeCollision (50 players)

Bike collision with 50 players

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 6.23ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.007 ms |
| Max | 0.634 ms |
| Average | 0.012 ms |
| Median | 0.010 ms |
| P95 | 0.013 ms |
| P99 | 0.043 ms |
| Std Dev | 0.029 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 0.63] ms

0.01 - 0.07 | ######################################## (497)
0.07 - 0.13 |  (2)
0.13 - 0.20 |  (0)
0.20 - 0.26 |  (0)
0.26 - 0.32 |  (0)
0.32 - 0.38 |  (0)
0.38 - 0.45 |  (0)
0.45 - 0.51 |  (0)
0.51 - 0.57 |  (0)
0.57 - 0.63 |  (1)
```


### CollisionDetection: checkArenaBounds (inside)

Arena bounds check (inside)

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 7.82ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 1.117 ms |
| Average | 0.001 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.001 ms |
| Std Dev | 0.011 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.12] ms

0.00 - 0.11 | ######################################## (9998)
0.11 - 0.22 |  (1)
0.22 - 0.34 |  (0)
0.34 - 0.45 |  (0)
0.45 - 0.56 |  (0)
0.56 - 0.67 |  (0)
0.67 - 0.78 |  (0)
0.78 - 0.89 |  (0)
0.89 - 1.01 |  (0)
1.01 - 1.12 |  (1)
```


### CollisionDetection: checkArenaBounds (outside)

Arena bounds check (outside)

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 7.61ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 1.863 ms |
| Average | 0.001 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.002 ms |
| Std Dev | 0.024 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.86] ms

0.00 - 0.19 | ######################################## (9998)
0.19 - 0.37 |  (0)
0.37 - 0.56 |  (0)
0.56 - 0.75 |  (0)
0.75 - 0.93 |  (0)
0.93 - 1.12 |  (0)
1.12 - 1.30 |  (0)
1.30 - 1.49 |  (0)
1.49 - 1.68 |  (1)
1.68 - 1.86 |  (1)
```


### CollisionDetection: isPointNearSegment

Point near segment check

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 5.88ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.733 ms |
| Average | 0.000 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.001 ms |
| Std Dev | 0.008 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.73] ms

0.00 - 0.07 | ######################################## (9997)
0.07 - 0.15 |  (1)
0.15 - 0.22 |  (0)
0.22 - 0.29 |  (0)
0.29 - 0.37 |  (0)
0.37 - 0.44 |  (1)
0.44 - 0.51 |  (0)
0.51 - 0.59 |  (0)
0.59 - 0.66 |  (0)
0.66 - 0.73 |  (1)
```


### RubberSystem: Create RubberState

Create new RubberState instance

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 3.95ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.068 ms |
| Average | 0.000 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.001 ms |
| Std Dev | 0.001 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.07] ms

0.00 - 0.01 | ######################################## (9990)
0.01 - 0.01 |  (3)
0.01 - 0.02 |  (0)
0.02 - 0.03 |  (2)
0.03 - 0.03 |  (2)
0.03 - 0.04 |  (2)
0.04 - 0.05 |  (0)
0.05 - 0.05 |  (0)
0.05 - 0.06 |  (0)
0.06 - 0.07 |  (1)
```


### RubberSystem: updateRubber

Update rubber with decay

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 13.56ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 3.101 ms |
| Average | 0.001 ms |
| Median | 0.001 ms |
| P95 | 0.001 ms |
| P99 | 0.002 ms |
| Std Dev | 0.032 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 3.10] ms

0.00 - 0.31 | ######################################## (9998)
0.31 - 0.62 |  (0)
0.62 - 0.93 |  (1)
0.93 - 1.24 |  (0)
1.24 - 1.55 |  (0)
1.55 - 1.86 |  (0)
1.86 - 2.17 |  (0)
2.17 - 2.48 |  (0)
2.48 - 2.79 |  (0)
2.79 - 3.10 |  (1)
```


### RubberSystem: applyMalus

Apply malus penalty

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 8.02ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 1.921 ms |
| Average | 0.001 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.001 ms |
| Std Dev | 0.025 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.92] ms

0.00 - 0.19 | ######################################## (9997)
0.19 - 0.38 |  (0)
0.38 - 0.58 |  (0)
0.58 - 0.77 |  (0)
0.77 - 0.96 |  (0)
0.96 - 1.15 |  (1)
1.15 - 1.35 |  (1)
1.35 - 1.54 |  (0)
1.54 - 1.73 |  (0)
1.73 - 1.92 |  (1)
```


### RubberSystem: calculateEffectiveness

Calculate rubber effectiveness

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 5.86ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.931 ms |
| Average | 0.000 ms |
| Median | 0.000 ms |
| P95 | 0.000 ms |
| P99 | 0.001 ms |
| Std Dev | 0.011 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.93] ms

0.00 - 0.09 | ######################################## (9998)
0.09 - 0.19 |  (0)
0.19 - 0.28 |  (0)
0.28 - 0.37 |  (0)
0.37 - 0.47 |  (0)
0.47 - 0.56 |  (0)
0.56 - 0.65 |  (1)
0.65 - 0.75 |  (0)
0.75 - 0.84 |  (0)
0.84 - 0.93 |  (1)
```


### RubberSystem: consumeRubber

Consume rubber amount

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 4.92ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 0.064 ms |
| Average | 0.000 ms |
| Median | 0.000 ms |
| P95 | 0.001 ms |
| P99 | 0.001 ms |
| Std Dev | 0.001 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.06] ms

0.00 - 0.01 | ######################################## (9987)
0.01 - 0.01 |  (4)
0.01 - 0.02 |  (1)
0.02 - 0.03 |  (1)
0.03 - 0.03 |  (2)
0.03 - 0.04 |  (1)
0.04 - 0.04 |  (2)
0.04 - 0.05 |  (1)
0.05 - 0.06 |  (0)
0.06 - 0.06 |  (1)
```


### RubberSystem: regenerateRubber

Regenerate rubber over time

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 6.73ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 1.608 ms |
| Average | 0.001 ms |
| Median | 0.000 ms |
| P95 | 0.000 ms |
| P99 | 0.001 ms |
| Std Dev | 0.021 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.61] ms

0.00 - 0.16 | ######################################## (9997)
0.16 - 0.32 |  (0)
0.32 - 0.48 |  (0)
0.48 - 0.64 |  (0)
0.64 - 0.80 |  (1)
0.80 - 0.96 |  (0)
0.96 - 1.13 |  (0)
1.13 - 1.29 |  (1)
1.29 - 1.45 |  (0)
1.45 - 1.61 |  (1)
```


### RubberSystem: detectWallProximity (10 segments)

Detect wall proximity with 10 segments

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 12.19ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.001 ms |
| Max | 0.838 ms |
| Average | 0.006 ms |
| Median | 0.007 ms |
| P95 | 0.008 ms |
| P99 | 0.012 ms |
| Std Dev | 0.019 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.84] ms

0.00 - 0.08 | ######################################## (1998)
0.08 - 0.17 |  (1)
0.17 - 0.25 |  (0)
0.25 - 0.34 |  (0)
0.34 - 0.42 |  (0)
0.42 - 0.50 |  (0)
0.50 - 0.59 |  (0)
0.59 - 0.67 |  (0)
0.67 - 0.75 |  (0)
0.75 - 0.84 |  (1)
```


### RubberSystem: detectWallProximity (100 segments)

Detect wall proximity with 100 segments

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 6.89ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.010 ms |
| Max | 0.621 ms |
| Average | 0.014 ms |
| Median | 0.012 ms |
| P95 | 0.014 ms |
| P99 | 0.023 ms |
| Std Dev | 0.027 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 0.62] ms

0.01 - 0.07 | ######################################## (499)
0.07 - 0.13 |  (0)
0.13 - 0.19 |  (0)
0.19 - 0.25 |  (0)
0.25 - 0.32 |  (0)
0.32 - 0.38 |  (0)
0.38 - 0.44 |  (0)
0.44 - 0.50 |  (0)
0.50 - 0.56 |  (0)
0.56 - 0.62 |  (1)
```


### RubberSystem: calculateWallDistance (100 segments)

Calculate wall distance

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 14.87ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.010 ms |
| Max | 2.665 ms |
| Average | 0.015 ms |
| Median | 0.011 ms |
| P95 | 0.014 ms |
| P99 | 0.035 ms |
| Std Dev | 0.086 ms |
| Variance | 0.007 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 2.67] ms

0.01 - 0.28 | ######################################## (998)
0.28 - 0.54 |  (0)
0.54 - 0.81 |  (1)
0.81 - 1.07 |  (0)
1.07 - 1.34 |  (0)
1.34 - 1.60 |  (0)
1.60 - 1.87 |  (0)
1.87 - 2.13 |  (0)
2.13 - 2.40 |  (0)
2.40 - 2.67 |  (1)
```


### RubberSystem: isNearWall (100 segments)

Check if near wall

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 15.27ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.005 ms |
| Max | 0.513 ms |
| Average | 0.008 ms |
| Median | 0.007 ms |
| P95 | 0.010 ms |
| P99 | 0.014 ms |
| Std Dev | 0.016 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 0.51] ms

0.01 - 0.06 | ######################################## (1996)
0.06 - 0.11 |  (1)
0.11 - 0.16 |  (0)
0.16 - 0.21 |  (0)
0.21 - 0.26 |  (0)
0.26 - 0.31 |  (0)
0.31 - 0.36 |  (2)
0.36 - 0.41 |  (0)
0.41 - 0.46 |  (0)
0.46 - 0.51 |  (1)
```


### RubberSystem: calculateSpeedAdjustment

Calculate speed adjustment near walls

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 6.83ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.004 ms |
| Max | 0.469 ms |
| Average | 0.007 ms |
| Median | 0.004 ms |
| P95 | 0.030 ms |
| P99 | 0.035 ms |
| Std Dev | 0.016 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.47] ms

0.00 - 0.05 | ######################################## (995)
0.05 - 0.10 |  (4)
0.10 - 0.14 |  (0)
0.14 - 0.19 |  (0)
0.19 - 0.24 |  (0)
0.24 - 0.28 |  (0)
0.28 - 0.33 |  (0)
0.33 - 0.38 |  (0)
0.38 - 0.42 |  (0)
0.42 - 0.47 |  (1)
```


### RubberSystem: applyRubberCollision

Full rubber collision response

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 11.57ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.008 ms |
| Max | 0.620 ms |
| Average | 0.023 ms |
| Median | 0.014 ms |
| P95 | 0.036 ms |
| P99 | 0.056 ms |
| Std Dev | 0.030 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 0.62] ms

0.01 - 0.07 | ######################################## (495)
0.07 - 0.13 |  (3)
0.13 - 0.19 |  (1)
0.19 - 0.25 |  (0)
0.25 - 0.31 |  (0)
0.31 - 0.38 |  (0)
0.38 - 0.44 |  (0)
0.44 - 0.50 |  (0)
0.50 - 0.56 |  (0)
0.56 - 0.62 |  (1)
```


### EntityManager: Create 100 entities

Create 100 entities

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 59.42ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.066 ms |
| Max | 0.859 ms |
| Average | 0.118 ms |
| Median | 0.124 ms |
| P95 | 0.175 ms |
| P99 | 0.235 ms |
| Std Dev | 0.060 ms |
| Variance | 0.004 |

**Distribution (ASCII Histogram):**

```
Range: [0.07, 0.86] ms

0.07 - 0.15 | ######################################## (438)
0.15 - 0.22 | ##### (55)
0.22 - 0.30 |  (2)
0.30 - 0.38 |  (1)
0.38 - 0.46 |  (0)
0.46 - 0.54 |  (2)
0.54 - 0.62 |  (0)
0.62 - 0.70 |  (1)
0.70 - 0.78 |  (0)
0.78 - 0.86 |  (1)
```


### EntityManager: Create 1000 entities

Create 1000 entities

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 91.98ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 0.684 ms |
| Max | 2.044 ms |
| Average | 0.919 ms |
| Median | 0.754 ms |
| P95 | 1.595 ms |
| P99 | 1.969 ms |
| Std Dev | 0.317 ms |
| Variance | 0.101 |

**Distribution (ASCII Histogram):**

```
Range: [0.68, 2.04] ms

0.68 - 0.82 | ######################################## (68)
0.82 - 0.96 | ### (5)
0.96 - 1.09 | # (2)
1.09 - 1.23 | ### (5)
1.23 - 1.36 | ##### (9)
1.36 - 1.50 | ## (4)
1.50 - 1.64 | # (2)
1.64 - 1.77 | # (2)
1.77 - 1.91 | # (1)
1.91 - 2.04 | # (2)
```


### EntityManager: Create 10000 entities

Create 10000 entities

**Configuration:**
- Iterations: 20
- Warmup: 100
- Total Duration: 420.44ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 20 |
| Min | 12.279 ms |
| Max | 30.611 ms |
| Average | 21.018 ms |
| Median | 20.220 ms |
| P95 | 29.980 ms |
| P99 | 30.485 ms |
| Std Dev | 6.006 ms |
| Variance | 36.066 |

**Distribution (ASCII Histogram):**

```
Range: [12.28, 30.61] ms

12.28 - 14.11 | ######################################## (4)
14.11 - 15.95 |  (0)
15.95 - 17.78 | ############################## (3)
17.78 - 19.61 | #################### (2)
19.61 - 21.45 | #################### (2)
21.45 - 23.28 | ########## (1)
23.28 - 25.11 | #################### (2)
25.11 - 26.94 | ########## (1)
26.94 - 28.78 | #################### (2)
28.78 - 30.61 | ############################## (3)
```


### EntityManager: Update 100 entities

Update 100 entities

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 64.28ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.084 ms |
| Max | 5.870 ms |
| Average | 0.128 ms |
| Median | 0.090 ms |
| P95 | 0.180 ms |
| P99 | 0.462 ms |
| Std Dev | 0.264 ms |
| Variance | 0.070 |

**Distribution (ASCII Histogram):**

```
Range: [0.08, 5.87] ms

0.08 - 0.66 | ######################################## (498)
0.66 - 1.24 |  (1)
1.24 - 1.82 |  (0)
1.82 - 2.40 |  (0)
2.40 - 2.98 |  (0)
2.98 - 3.56 |  (0)
3.56 - 4.13 |  (0)
4.13 - 4.71 |  (0)
4.71 - 5.29 |  (0)
5.29 - 5.87 |  (1)
```


### EntityManager: Query by type (1000 entities)

Query entities by type

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 442.22ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.589 ms |
| Max | 5.369 ms |
| Average | 0.884 ms |
| Median | 0.671 ms |
| P95 | 1.410 ms |
| P99 | 2.267 ms |
| Std Dev | 0.419 ms |
| Variance | 0.176 |

**Distribution (ASCII Histogram):**

```
Range: [0.59, 5.37] ms

0.59 - 1.07 | ######################################## (350)
1.07 - 1.55 | ############### (135)
1.55 - 2.02 | # (5)
2.02 - 2.50 | # (5)
2.50 - 2.98 |  (1)
2.98 - 3.46 |  (2)
3.46 - 3.93 |  (1)
3.93 - 4.41 |  (0)
4.41 - 4.89 |  (0)
4.89 - 5.37 |  (1)
```


### EntityManager: Query by component (1000 entities)

Query entities by component

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 781.85ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 1.041 ms |
| Max | 3.407 ms |
| Average | 1.563 ms |
| Median | 1.278 ms |
| P95 | 2.656 ms |
| P99 | 2.894 ms |
| Std Dev | 0.525 ms |
| Variance | 0.275 |

**Distribution (ASCII Histogram):**

```
Range: [1.04, 3.41] ms

1.04 - 1.28 | ######################################## (251)
1.28 - 1.51 | ### (18)
1.51 - 1.75 | ######### (56)
1.75 - 1.99 | ######## (53)
1.99 - 2.22 | ########### (72)
2.22 - 2.46 | ## (14)
2.46 - 2.70 | ## (15)
2.70 - 2.93 | ### (16)
2.93 - 3.17 |  (2)
3.17 - 3.41 |  (3)
```


### EntityManager: Query AND (position + velocity)

Complex query with AND logic

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 886.59ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 1.167 ms |
| Max | 6.791 ms |
| Average | 1.773 ms |
| Median | 1.564 ms |
| P95 | 2.877 ms |
| P99 | 3.843 ms |
| Std Dev | 0.665 ms |
| Variance | 0.443 |

**Distribution (ASCII Histogram):**

```
Range: [1.17, 6.79] ms

1.17 - 1.73 | ######################################## (272)
1.73 - 2.29 | ####################### (153)
2.29 - 2.85 | ####### (49)
2.85 - 3.42 | ## (15)
3.42 - 3.98 | # (6)
3.98 - 4.54 |  (2)
4.54 - 5.10 |  (1)
5.10 - 5.67 |  (0)
5.67 - 6.23 |  (0)
6.23 - 6.79 |  (2)
```


### EntityManager: Destroy 100 entities

Destroy 100 entities

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 58.68ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.077 ms |
| Max | 2.061 ms |
| Average | 0.117 ms |
| Median | 0.086 ms |
| P95 | 0.172 ms |
| P99 | 0.654 ms |
| Std Dev | 0.121 ms |
| Variance | 0.015 |

**Distribution (ASCII Histogram):**

```
Range: [0.08, 2.06] ms

0.08 - 0.28 | ######################################## (491)
0.28 - 0.47 |  (2)
0.47 - 0.67 |  (2)
0.67 - 0.87 |  (3)
0.87 - 1.07 |  (0)
1.07 - 1.27 |  (1)
1.27 - 1.47 |  (0)
1.47 - 1.66 |  (0)
1.66 - 1.86 |  (0)
1.86 - 2.06 |  (1)
```


### EntityManager: Clear 1000 entities

Clear all entities

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 100.76ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 0.653 ms |
| Max | 2.226 ms |
| Average | 1.007 ms |
| Median | 0.960 ms |
| P95 | 1.695 ms |
| P99 | 2.099 ms |
| Std Dev | 0.354 ms |
| Variance | 0.125 |

**Distribution (ASCII Histogram):**

```
Range: [0.65, 2.23] ms

0.65 - 0.81 | ######################################## (48)
0.81 - 0.97 | ## (2)
0.97 - 1.12 | ######## (9)
1.12 - 1.28 | ###################### (26)
1.28 - 1.44 | #### (5)
1.44 - 1.60 | ### (3)
1.60 - 1.75 | ## (2)
1.75 - 1.91 | ## (2)
1.91 - 2.07 | # (1)
2.07 - 2.23 | ## (2)
```


## Recommendations

- **SpatialHash: Insert 100 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **SpatialHash: Insert 100 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **SpatialHash: Insert 10000 entities**: Consider optimizing spatial partitioning or reducing entity count for better performance.
- **SpatialHash: Query 100 entities (radius=10)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **SpatialHash: Query 100 entities (radius=10)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **SpatialHash: Query 1000 entities (radius=10)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **SpatialHash: Query 1000 entities (radius=10)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **SpatialHash: Query 10000 entities (radius=10)**: Consider optimizing spatial partitioning or reducing entity count for better performance.
- **SpatialHash: Query IDs 1000 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **SpatialHash: Query IDs 1000 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **SpatialHash: Update 100 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **SpatialHash: Update 100 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **SpatialHash: Remove 100 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **SpatialHash: Remove 100 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: distanceToSegment (basic)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: distanceToSegment (basic)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: distanceToSegmentWithClosest**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: distanceToSegmentWithClosest**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: distanceToSegmentSquared**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: distanceToSegmentSquared**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: distanceToSegment (100 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: distanceToSegment (100 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: distanceToSegment (1000 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: lineSegmentIntersection (basic)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: lineSegmentIntersection (basic)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: lineSegmentIntersection (parallel)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: lineSegmentIntersection (parallel)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: intersection vs 100 segments**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: intersection vs 100 segments**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: continuousCollisionCheck (10 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: continuousCollisionCheck (10 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: continuousCollisionCheck (100 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: continuousCollisionCheck (100 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: checkTrailCollision**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: checkTrailCollision**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: checkBikeCollision (10 players)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: checkBikeCollision (10 players)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: checkBikeCollision (50 players)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: checkBikeCollision (50 players)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: checkArenaBounds (inside)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: checkArenaBounds (inside)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: checkArenaBounds (outside)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: checkArenaBounds (outside)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **CollisionDetection: isPointNearSegment**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **CollisionDetection: isPointNearSegment**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: Create RubberState**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: Create RubberState**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: updateRubber**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: updateRubber**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: applyMalus**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: applyMalus**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: calculateEffectiveness**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: calculateEffectiveness**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: consumeRubber**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: consumeRubber**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: regenerateRubber**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: regenerateRubber**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: detectWallProximity (10 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: detectWallProximity (10 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: detectWallProximity (100 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: detectWallProximity (100 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: calculateWallDistance (100 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: calculateWallDistance (100 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: isNearWall (100 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: isNearWall (100 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: calculateSpeedAdjustment**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: calculateSpeedAdjustment**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **RubberSystem: applyRubberCollision**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **RubberSystem: applyRubberCollision**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **EntityManager: Create 100 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **EntityManager: Create 100 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **EntityManager: Update 100 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **EntityManager: Update 100 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **EntityManager: Query by type (1000 entities)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **EntityManager: Destroy 100 entities**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **EntityManager: Destroy 100 entities**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
