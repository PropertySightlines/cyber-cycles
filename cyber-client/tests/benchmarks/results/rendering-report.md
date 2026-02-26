# Cyber Cycles Rendering Benchmarks - Benchmark Report

**Generated:** 2026-02-25T13:08:11.939Z

## Test Environment

| Property | Value |
|----------|-------|
| Platform | Node.js |
| Timestamp | 2026-02-25T13:08:01.456Z |

## Summary

| Benchmark | Iterations | Min (ms) | Max (ms) | Avg (ms) | Median (ms) | P95 (ms) | P99 (ms) |
|-----------|------------|----------|----------|----------|-------------|----------|----------|
| TrailEntity: addPoint (single) | 10000 | 0.000 | 10.458 | 0.003 | 0.001 | 0.004 | 0.007 |
| TrailEntity: addPoint (10 points) | 5000 | 0.002 | 7.721 | 0.013 | 0.003 | 0.011 | 0.037 |
| TrailEntity: addPoint (100 points) | 1000 | 0.080 | 0.900 | 0.142 | 0.135 | 0.267 | 0.381 |
| TrailEntity: addPoint (1000 points, maxLength=200) | 200 | 3.376 | 9.917 | 4.744 | 4.679 | 6.588 | 8.963 |
| TrailEntity: addPoint (with spacing check) | 5000 | 0.001 | 17.397 | 0.006 | 0.003 | 0.004 | 0.006 |
| TrailEntity: getRenderData (10 segments) | 2000 | 0.003 | 11.167 | 0.017 | 0.007 | 0.021 | 0.035 |
| TrailEntity: getRenderData (50 segments) | 500 | 0.039 | 4.222 | 0.078 | 0.059 | 0.081 | 0.610 |
| TrailEntity: getRenderData (100 segments) | 200 | 0.183 | 1.203 | 0.265 | 0.225 | 0.579 | 0.965 |
| TrailEntity: getRenderData (200 segments) | 100 | 0.715 | 5.482 | 1.046 | 0.967 | 1.512 | 1.662 |
| TrailEntity: getRenderData (repeated, 50 segments) | 500 | 0.043 | 3.387 | 0.082 | 0.067 | 0.106 | 0.488 |
| TrailEntity: getSegments (100 points) | 2000 | 0.135 | 6.179 | 0.213 | 0.194 | 0.423 | 0.622 |
| TrailEntity: getSegment (by index) | 5000 | 0.105 | 0.993 | 0.194 | 0.178 | 0.346 | 0.608 |
| TrailEntity: segmentCount | 10000 | 0.108 | 0.930 | 0.196 | 0.185 | 0.343 | 0.586 |
| TrailEntity: getLength | 5000 | 0.127 | 0.998 | 0.202 | 0.191 | 0.349 | 0.554 |
| TrailEntity: trimToLength | 1000 | 0.485 | 1.718 | 0.834 | 0.827 | 1.282 | 1.403 |
| TrailEntity: clear | 2000 | 0.108 | 0.829 | 0.166 | 0.161 | 0.289 | 0.483 |
| TrailEntity: getCollisionSegments | 2000 | 0.107 | 8.718 | 0.163 | 0.134 | 0.306 | 0.482 |
| TrailEntity: isPointNearTrail (100 segments) | 1000 | 0.109 | 0.894 | 0.167 | 0.141 | 0.315 | 0.505 |
| TrailEntity: getClosestSegment (100 segments) | 1000 | 0.109 | 0.666 | 0.160 | 0.139 | 0.282 | 0.442 |
| TrailEntity: updateSpatialHash (100 points) | 500 | 0.117 | 0.800 | 0.194 | 0.188 | 0.364 | 0.465 |
| TrailEntity: getNearbySegments (with spatial hash) | 500 | 0.121 | 0.630 | 0.173 | 0.144 | 0.316 | 0.491 |
| TrailEntity: removeFromSpatialHash | 500 | 0.126 | 0.628 | 0.199 | 0.193 | 0.347 | 0.551 |
| PlayerEntity: Create | 5000 | 0.001 | 3.808 | 0.006 | 0.002 | 0.004 | 0.009 |
| PlayerEntity: Create 10 players | 1000 | 0.004 | 7.244 | 0.033 | 0.016 | 0.032 | 0.286 |
| PlayerEntity: Create 100 players | 200 | 0.063 | 0.785 | 0.162 | 0.173 | 0.210 | 0.743 |
| PlayerEntity: physics.update | 10000 | 0.001 | 7.630 | 0.004 | 0.001 | 0.004 | 0.005 |
| PlayerEntity: rubber.update | 2000 | 0.003 | 6.543 | 0.011 | 0.004 | 0.011 | 0.016 |
| PlayerEntity: state.update | 10000 | 0.001 | 6.209 | 0.003 | 0.001 | 0.003 | 0.005 |
| PlayerEntity: Full update | 2000 | 0.003 | 7.132 | 0.009 | 0.005 | 0.007 | 0.016 |
| PlayerEntity: render.addTrailPoint | 10000 | 0.001 | 8.553 | 0.003 | 0.001 | 0.002 | 0.004 |
| PlayerEntity: render.updateTrail | 5000 | 0.002 | 0.678 | 0.003 | 0.003 | 0.005 | 0.007 |
| PlayerEntity: render.setColor | 10000 | 0.002 | 1.484 | 0.003 | 0.002 | 0.003 | 0.006 |
| PlayerEntity: render.clearTrail | 2000 | 0.007 | 6.071 | 0.014 | 0.009 | 0.012 | 0.023 |
| PlayerEntity: state.transition (ALIVE->DEAD) | 5000 | 0.001 | 8.604 | 0.008 | 0.002 | 0.006 | 0.010 |
| PlayerEntity: state.respawn cycle | 2000 | 0.008 | 5.465 | 0.028 | 0.014 | 0.024 | 0.054 |
| PlayerEntity: state.setBoosting | 5000 | 0.001 | 6.732 | 0.006 | 0.002 | 0.004 | 0.008 |
| PlayerEntity: state.canTransition | 10000 | 0.001 | 2.594 | 0.002 | 0.001 | 0.001 | 0.004 |
| PlayerEntity: physics.toJSON | 5000 | 0.001 | 1.965 | 0.002 | 0.001 | 0.002 | 0.005 |
| PlayerEntity: rubber.toJSON | 5000 | 0.001 | 1.975 | 0.002 | 0.001 | 0.002 | 0.004 |
| PlayerEntity: render.toJSON | 2000 | 0.001 | 4.472 | 0.005 | 0.002 | 0.005 | 0.006 |
| PlayerEntity: physics.fromJSON | 5000 | 0.001 | 1.230 | 0.002 | 0.001 | 0.002 | 0.005 |
| FrameTime: 10 players (physics + rubber) | 1000 | 0.018 | 2.398 | 0.051 | 0.046 | 0.064 | 0.418 |
| FrameTime: 50 players (physics + rubber) | 200 | 0.274 | 3.378 | 0.361 | 0.333 | 0.422 | 0.699 |
| FrameTime: 10 players (with trail render) | 500 | 0.109 | 2.891 | 0.173 | 0.134 | 0.246 | 0.864 |
| FrameTime: Budget check (100 entities) | 100 | 0.066 | 2.349 | 0.187 | 0.089 | 1.265 | 1.743 |

## Detailed Results

### TrailEntity: addPoint (single)

Add individual trail points

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 37.23ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.000 ms |
| Max | 10.458 ms |
| Average | 0.003 ms |
| Median | 0.001 ms |
| P95 | 0.004 ms |
| P99 | 0.007 ms |
| Std Dev | 0.110 ms |
| Variance | 0.012 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 10.46] ms

0.00 - 1.05 | ######################################## (9997)
1.05 - 2.09 |  (1)
2.09 - 3.14 |  (1)
3.14 - 4.18 |  (0)
4.18 - 5.23 |  (0)
5.23 - 6.27 |  (0)
6.27 - 7.32 |  (0)
7.32 - 8.37 |  (0)
8.37 - 9.41 |  (0)
9.41 - 10.46 |  (1)
```


### TrailEntity: addPoint (10 points)

Add 10 trail points

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 69.36ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.002 ms |
| Max | 7.721 ms |
| Average | 0.013 ms |
| Median | 0.003 ms |
| P95 | 0.011 ms |
| P99 | 0.037 ms |
| Std Dev | 0.221 ms |
| Variance | 0.049 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 7.72] ms

0.00 - 0.77 | ######################################## (4987)
0.77 - 1.55 |  (6)
1.55 - 2.32 |  (1)
2.32 - 3.09 |  (0)
3.09 - 3.86 |  (1)
3.86 - 4.63 |  (0)
4.63 - 5.41 |  (0)
5.41 - 6.18 |  (2)
6.18 - 6.95 |  (1)
6.95 - 7.72 |  (2)
```


### TrailEntity: addPoint (100 points)

Add 100 trail points

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 142.42ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.080 ms |
| Max | 0.900 ms |
| Average | 0.142 ms |
| Median | 0.135 ms |
| P95 | 0.267 ms |
| P99 | 0.381 ms |
| Std Dev | 0.078 ms |
| Variance | 0.006 |

**Distribution (ASCII Histogram):**

```
Range: [0.08, 0.90] ms

0.08 - 0.16 | ######################################## (812)
0.16 - 0.24 | ##### (98)
0.24 - 0.33 | #### (73)
0.33 - 0.41 |  (8)
0.41 - 0.49 |  (0)
0.49 - 0.57 |  (1)
0.57 - 0.65 |  (2)
0.65 - 0.74 |  (2)
0.74 - 0.82 |  (2)
0.82 - 0.90 |  (2)
```


### TrailEntity: addPoint (1000 points, maxLength=200)

Add 1000 points with automatic trimming

**Configuration:**
- Iterations: 200
- Warmup: 100
- Total Duration: 949.24ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 200 |
| Min | 3.376 ms |
| Max | 9.917 ms |
| Average | 4.744 ms |
| Median | 4.679 ms |
| P95 | 6.588 ms |
| P99 | 8.963 ms |
| Std Dev | 1.029 ms |
| Variance | 1.058 |

**Distribution (ASCII Histogram):**

```
Range: [3.38, 9.92] ms

3.38 - 4.03 | ################################### (52)
4.03 - 4.68 | ################################# (50)
4.68 - 5.34 | ######################################## (60)
5.34 - 5.99 | ############## (21)
5.99 - 6.65 | ##### (7)
6.65 - 7.30 | ### (5)
7.30 - 7.95 | # (1)
7.95 - 8.61 | # (1)
8.61 - 9.26 | # (1)
9.26 - 9.92 | # (2)
```


### TrailEntity: addPoint (with spacing check)

Add points with minimum spacing validation

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 30.64ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 17.397 ms |
| Average | 0.006 ms |
| Median | 0.003 ms |
| P95 | 0.004 ms |
| P99 | 0.006 ms |
| Std Dev | 0.246 ms |
| Variance | 0.061 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 17.40] ms

0.00 - 1.74 | ######################################## (4999)
1.74 - 3.48 |  (0)
3.48 - 5.22 |  (0)
5.22 - 6.96 |  (0)
6.96 - 8.70 |  (0)
8.70 - 10.44 |  (0)
10.44 - 12.18 |  (0)
12.18 - 13.92 |  (0)
13.92 - 15.66 |  (0)
15.66 - 17.40 |  (1)
```


### TrailEntity: getRenderData (10 segments)

Generate render data for 10 segments

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 34.79ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.003 ms |
| Max | 11.167 ms |
| Average | 0.017 ms |
| Median | 0.007 ms |
| P95 | 0.021 ms |
| P99 | 0.035 ms |
| Std Dev | 0.262 ms |
| Variance | 0.069 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 11.17] ms

0.00 - 1.12 | ######################################## (1997)
1.12 - 2.24 |  (1)
2.24 - 3.35 |  (1)
3.35 - 4.47 |  (0)
4.47 - 5.59 |  (0)
5.59 - 6.70 |  (0)
6.70 - 7.82 |  (0)
7.82 - 8.93 |  (0)
8.93 - 10.05 |  (0)
10.05 - 11.17 |  (1)
```


### TrailEntity: getRenderData (50 segments)

Generate render data for 50 segments

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 39.02ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.039 ms |
| Max | 4.222 ms |
| Average | 0.078 ms |
| Median | 0.059 ms |
| P95 | 0.081 ms |
| P99 | 0.610 ms |
| Std Dev | 0.201 ms |
| Variance | 0.041 |

**Distribution (ASCII Histogram):**

```
Range: [0.04, 4.22] ms

0.04 - 0.46 | ######################################## (493)
0.46 - 0.88 |  (5)
0.88 - 1.29 |  (1)
1.29 - 1.71 |  (0)
1.71 - 2.13 |  (0)
2.13 - 2.55 |  (0)
2.55 - 2.97 |  (0)
2.97 - 3.39 |  (0)
3.39 - 3.80 |  (0)
3.80 - 4.22 |  (1)
```


### TrailEntity: getRenderData (100 segments)

Generate render data for 100 segments

**Configuration:**
- Iterations: 200
- Warmup: 100
- Total Duration: 53.03ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 200 |
| Min | 0.183 ms |
| Max | 1.203 ms |
| Average | 0.265 ms |
| Median | 0.225 ms |
| P95 | 0.579 ms |
| P99 | 0.965 ms |
| Std Dev | 0.139 ms |
| Variance | 0.019 |

**Distribution (ASCII Histogram):**

```
Range: [0.18, 1.20] ms

0.18 - 0.29 | ######################################## (174)
0.29 - 0.39 | ### (11)
0.39 - 0.49 |  (2)
0.49 - 0.59 | # (3)
0.59 - 0.69 | # (6)
0.69 - 0.79 |  (0)
0.79 - 0.90 |  (1)
0.90 - 1.00 |  (1)
1.00 - 1.10 |  (1)
1.10 - 1.20 |  (1)
```


### TrailEntity: getRenderData (200 segments)

Generate render data for 200 segments

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 104.70ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 0.715 ms |
| Max | 5.482 ms |
| Average | 1.046 ms |
| Median | 0.967 ms |
| P95 | 1.512 ms |
| P99 | 1.662 ms |
| Std Dev | 0.498 ms |
| Variance | 0.248 |

**Distribution (ASCII Histogram):**

```
Range: [0.72, 5.48] ms

0.72 - 1.19 | ######################################## (83)
1.19 - 1.67 | ######## (16)
1.67 - 2.15 |  (0)
2.15 - 2.62 |  (0)
2.62 - 3.10 |  (0)
3.10 - 3.58 |  (0)
3.58 - 4.05 |  (0)
4.05 - 4.53 |  (0)
4.53 - 5.00 |  (0)
5.00 - 5.48 |  (1)
```


### TrailEntity: getRenderData (repeated, 50 segments)

Repeated render data calls

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 40.94ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.043 ms |
| Max | 3.387 ms |
| Average | 0.082 ms |
| Median | 0.067 ms |
| P95 | 0.106 ms |
| P99 | 0.488 ms |
| Std Dev | 0.172 ms |
| Variance | 0.030 |

**Distribution (ASCII Histogram):**

```
Range: [0.04, 3.39] ms

0.04 - 0.38 | ######################################## (492)
0.38 - 0.71 |  (4)
0.71 - 1.05 |  (1)
1.05 - 1.38 |  (2)
1.38 - 1.72 |  (0)
1.72 - 2.05 |  (0)
2.05 - 2.38 |  (0)
2.38 - 2.72 |  (0)
2.72 - 3.05 |  (0)
3.05 - 3.39 |  (1)
```


### TrailEntity: getSegments (100 points)

Get cached segments

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 426.33ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.135 ms |
| Max | 6.179 ms |
| Average | 0.213 ms |
| Median | 0.194 ms |
| P95 | 0.423 ms |
| P99 | 0.622 ms |
| Std Dev | 0.167 ms |
| Variance | 0.028 |

**Distribution (ASCII Histogram):**

```
Range: [0.14, 6.18] ms

0.14 - 0.74 | ######################################## (1995)
0.74 - 1.34 |  (2)
1.34 - 1.95 |  (1)
1.95 - 2.55 |  (1)
2.55 - 3.16 |  (0)
3.16 - 3.76 |  (0)
3.76 - 4.37 |  (0)
4.37 - 4.97 |  (0)
4.97 - 5.57 |  (0)
5.57 - 6.18 |  (1)
```


### TrailEntity: getSegment (by index)

Get specific segment by index

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 970.39ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.105 ms |
| Max | 0.993 ms |
| Average | 0.194 ms |
| Median | 0.178 ms |
| P95 | 0.346 ms |
| P99 | 0.608 ms |
| Std Dev | 0.088 ms |
| Variance | 0.008 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 0.99] ms

0.11 - 0.19 | ######################################## (3132)
0.19 - 0.28 | ################### (1525)
0.28 - 0.37 | ## (131)
0.37 - 0.46 | # (74)
0.46 - 0.55 | # (61)
0.55 - 0.64 |  (39)
0.64 - 0.73 |  (21)
0.73 - 0.82 |  (7)
0.82 - 0.90 |  (7)
0.90 - 0.99 |  (3)
```


### TrailEntity: segmentCount

Get segment count

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 1958.40ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.108 ms |
| Max | 0.930 ms |
| Average | 0.196 ms |
| Median | 0.185 ms |
| P95 | 0.343 ms |
| P99 | 0.586 ms |
| Std Dev | 0.084 ms |
| Variance | 0.007 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 0.93] ms

0.11 - 0.19 | ######################################## (5541)
0.19 - 0.27 | ############################ (3830)
0.27 - 0.35 | # (151)
0.35 - 0.44 | # (99)
0.44 - 0.52 | # (149)
0.52 - 0.60 | # (153)
0.60 - 0.68 |  (57)
0.68 - 0.77 |  (11)
0.77 - 0.85 |  (5)
0.85 - 0.93 |  (4)
```


### TrailEntity: getLength

Calculate total trail length

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 1012.88ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.127 ms |
| Max | 0.998 ms |
| Average | 0.202 ms |
| Median | 0.191 ms |
| P95 | 0.349 ms |
| P99 | 0.554 ms |
| Std Dev | 0.077 ms |
| Variance | 0.006 |

**Distribution (ASCII Histogram):**

```
Range: [0.13, 1.00] ms

0.13 - 0.21 | ######################################## (3952)
0.21 - 0.30 | ####### (718)
0.30 - 0.39 | # (127)
0.39 - 0.48 | # (92)
0.48 - 0.56 | # (64)
0.56 - 0.65 |  (33)
0.65 - 0.74 |  (8)
0.74 - 0.82 |  (2)
0.82 - 0.91 |  (2)
0.91 - 1.00 |  (2)
```


### TrailEntity: trimToLength

Trim trail to max length

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 835.08ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.485 ms |
| Max | 1.718 ms |
| Average | 0.834 ms |
| Median | 0.827 ms |
| P95 | 1.282 ms |
| P99 | 1.403 ms |
| Std Dev | 0.205 ms |
| Variance | 0.042 |

**Distribution (ASCII Histogram):**

```
Range: [0.49, 1.72] ms

0.49 - 0.61 | ################### (133)
0.61 - 0.73 | ############################ (193)
0.73 - 0.85 | ######################################## (279)
0.85 - 0.98 | ################################ (225)
0.98 - 1.10 | ######## (57)
1.10 - 1.22 | ##### (38)
1.22 - 1.35 | ######## (58)
1.35 - 1.47 | ## (12)
1.47 - 1.59 |  (3)
1.59 - 1.72 |  (2)
```


### TrailEntity: clear

Clear all trail points

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 333.08ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.108 ms |
| Max | 0.829 ms |
| Average | 0.166 ms |
| Median | 0.161 ms |
| P95 | 0.289 ms |
| P99 | 0.483 ms |
| Std Dev | 0.067 ms |
| Variance | 0.005 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 0.83] ms

0.11 - 0.18 | ######################################## (1465)
0.18 - 0.25 | ########### (417)
0.25 - 0.32 | # (38)
0.32 - 0.40 | # (30)
0.40 - 0.47 | # (26)
0.47 - 0.54 |  (18)
0.54 - 0.61 |  (3)
0.61 - 0.69 |  (1)
0.69 - 0.76 |  (1)
0.76 - 0.83 |  (1)
```


### TrailEntity: getCollisionSegments

Get segments for collision detection

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 327.37ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.107 ms |
| Max | 8.718 ms |
| Average | 0.163 ms |
| Median | 0.134 ms |
| P95 | 0.306 ms |
| P99 | 0.482 ms |
| Std Dev | 0.202 ms |
| Variance | 0.041 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 8.72] ms

0.11 - 0.97 | ######################################## (1999)
0.97 - 1.83 |  (0)
1.83 - 2.69 |  (0)
2.69 - 3.55 |  (0)
3.55 - 4.41 |  (0)
4.41 - 5.27 |  (0)
5.27 - 6.13 |  (0)
6.13 - 7.00 |  (0)
7.00 - 7.86 |  (0)
7.86 - 8.72 |  (1)
```


### TrailEntity: isPointNearTrail (100 segments)

Check if point is near trail

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 167.26ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.109 ms |
| Max | 0.894 ms |
| Average | 0.167 ms |
| Median | 0.141 ms |
| P95 | 0.315 ms |
| P99 | 0.505 ms |
| Std Dev | 0.076 ms |
| Variance | 0.006 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 0.89] ms

0.11 - 0.19 | ######################################## (814)
0.19 - 0.27 | ###### (118)
0.27 - 0.34 | # (30)
0.34 - 0.42 | # (15)
0.42 - 0.50 | # (12)
0.50 - 0.58 |  (5)
0.58 - 0.66 |  (2)
0.66 - 0.74 |  (3)
0.74 - 0.82 |  (0)
0.82 - 0.89 |  (1)
```


### TrailEntity: getClosestSegment (100 segments)

Find closest segment to point

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 160.31ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.109 ms |
| Max | 0.666 ms |
| Average | 0.160 ms |
| Median | 0.139 ms |
| P95 | 0.282 ms |
| P99 | 0.442 ms |
| Std Dev | 0.061 ms |
| Variance | 0.004 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 0.67] ms

0.11 - 0.16 | ######################################## (601)
0.16 - 0.22 | ###################### (331)
0.22 - 0.28 | # (14)
0.28 - 0.33 | ## (26)
0.33 - 0.39 |  (7)
0.39 - 0.44 | # (11)
0.44 - 0.50 | # (8)
0.50 - 0.55 |  (0)
0.55 - 0.61 |  (0)
0.61 - 0.67 |  (2)
```


### TrailEntity: updateSpatialHash (100 points)

Build spatial hash index

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 97.04ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.117 ms |
| Max | 0.800 ms |
| Average | 0.194 ms |
| Median | 0.188 ms |
| P95 | 0.364 ms |
| P99 | 0.465 ms |
| Std Dev | 0.073 ms |
| Variance | 0.005 |

**Distribution (ASCII Histogram):**

```
Range: [0.12, 0.80] ms

0.12 - 0.19 | ######################################## (239)
0.19 - 0.25 | ###################################### (227)
0.25 - 0.32 | # (4)
0.32 - 0.39 | # (8)
0.39 - 0.46 | ### (15)
0.46 - 0.53 | # (4)
0.53 - 0.60 |  (0)
0.60 - 0.66 |  (2)
0.66 - 0.73 |  (0)
0.73 - 0.80 |  (1)
```


### TrailEntity: getNearbySegments (with spatial hash)

Query nearby segments using spatial hash

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 86.45ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.121 ms |
| Max | 0.630 ms |
| Average | 0.173 ms |
| Median | 0.144 ms |
| P95 | 0.316 ms |
| P99 | 0.491 ms |
| Std Dev | 0.068 ms |
| Variance | 0.005 |

**Distribution (ASCII Histogram):**

```
Range: [0.12, 0.63] ms

0.12 - 0.17 | ######################################## (334)
0.17 - 0.22 | ############## (119)
0.22 - 0.27 | ## (15)
0.27 - 0.32 | # (8)
0.32 - 0.38 | # (11)
0.38 - 0.43 |  (3)
0.43 - 0.48 |  (4)
0.48 - 0.53 |  (3)
0.53 - 0.58 |  (2)
0.58 - 0.63 |  (1)
```


### TrailEntity: removeFromSpatialHash

Remove trail from spatial hash

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 99.84ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.126 ms |
| Max | 0.628 ms |
| Average | 0.199 ms |
| Median | 0.193 ms |
| P95 | 0.347 ms |
| P99 | 0.551 ms |
| Std Dev | 0.080 ms |
| Variance | 0.006 |

**Distribution (ASCII Histogram):**

```
Range: [0.13, 0.63] ms

0.13 - 0.18 | ######################################## (218)
0.18 - 0.23 | ################################## (183)
0.23 - 0.28 | ############ (65)
0.28 - 0.33 | # (3)
0.33 - 0.38 | ## (10)
0.38 - 0.43 | # (4)
0.43 - 0.48 |  (1)
0.48 - 0.53 | # (8)
0.53 - 0.58 | # (5)
0.58 - 0.63 | # (3)
```


### PlayerEntity: Create

Create new PlayerEntity

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 29.49ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 3.808 ms |
| Average | 0.006 ms |
| Median | 0.002 ms |
| P95 | 0.004 ms |
| P99 | 0.009 ms |
| Std Dev | 0.085 ms |
| Variance | 0.007 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 3.81] ms

0.00 - 0.38 | ######################################## (4992)
0.38 - 0.76 |  (0)
0.76 - 1.14 |  (3)
1.14 - 1.52 |  (1)
1.52 - 1.90 |  (2)
1.90 - 2.29 |  (0)
2.29 - 2.67 |  (0)
2.67 - 3.05 |  (0)
3.05 - 3.43 |  (0)
3.43 - 3.81 |  (2)
```


### PlayerEntity: Create 10 players

Create 10 PlayerEntities

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 33.57ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.004 ms |
| Max | 7.244 ms |
| Average | 0.033 ms |
| Median | 0.016 ms |
| P95 | 0.032 ms |
| P99 | 0.286 ms |
| Std Dev | 0.261 ms |
| Variance | 0.068 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 7.24] ms

0.00 - 0.73 | ######################################## (990)
0.73 - 1.45 |  (8)
1.45 - 2.18 |  (0)
2.18 - 2.90 |  (1)
2.90 - 3.62 |  (0)
3.62 - 4.35 |  (0)
4.35 - 5.07 |  (0)
5.07 - 5.80 |  (0)
5.80 - 6.52 |  (0)
6.52 - 7.24 |  (1)
```


### PlayerEntity: Create 100 players

Create 100 PlayerEntities

**Configuration:**
- Iterations: 200
- Warmup: 100
- Total Duration: 32.46ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 200 |
| Min | 0.063 ms |
| Max | 0.785 ms |
| Average | 0.162 ms |
| Median | 0.173 ms |
| P95 | 0.210 ms |
| P99 | 0.743 ms |
| Std Dev | 0.098 ms |
| Variance | 0.010 |

**Distribution (ASCII Histogram):**

```
Range: [0.06, 0.78] ms

0.06 - 0.14 | ##################### (65)
0.14 - 0.21 | ######################################## (123)
0.21 - 0.28 | ## (6)
0.28 - 0.35 |  (1)
0.35 - 0.42 |  (1)
0.42 - 0.50 |  (0)
0.50 - 0.57 |  (0)
0.57 - 0.64 |  (0)
0.64 - 0.71 |  (1)
0.71 - 0.78 | # (3)
```


### PlayerEntity: physics.update

Update physics component

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 39.56ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.001 ms |
| Max | 7.630 ms |
| Average | 0.004 ms |
| Median | 0.001 ms |
| P95 | 0.004 ms |
| P99 | 0.005 ms |
| Std Dev | 0.100 ms |
| Variance | 0.010 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 7.63] ms

0.00 - 0.76 | ######################################## (9995)
0.76 - 1.53 |  (1)
1.53 - 2.29 |  (1)
2.29 - 3.05 |  (0)
3.05 - 3.82 |  (0)
3.82 - 4.58 |  (2)
4.58 - 5.34 |  (0)
5.34 - 6.10 |  (0)
6.10 - 6.87 |  (0)
6.87 - 7.63 |  (1)
```


### PlayerEntity: rubber.update

Update rubber component

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 30.60ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.003 ms |
| Max | 6.543 ms |
| Average | 0.011 ms |
| Median | 0.004 ms |
| P95 | 0.011 ms |
| P99 | 0.016 ms |
| Std Dev | 0.156 ms |
| Variance | 0.024 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 6.54] ms

0.00 - 0.66 | ######################################## (1997)
0.66 - 1.31 |  (1)
1.31 - 1.96 |  (0)
1.96 - 2.62 |  (1)
2.62 - 3.27 |  (0)
3.27 - 3.93 |  (0)
3.93 - 4.58 |  (0)
4.58 - 5.23 |  (0)
5.23 - 5.89 |  (0)
5.89 - 6.54 |  (1)
```


### PlayerEntity: state.update

Update state component

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 34.27ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.001 ms |
| Max | 6.209 ms |
| Average | 0.003 ms |
| Median | 0.001 ms |
| P95 | 0.003 ms |
| P99 | 0.005 ms |
| Std Dev | 0.077 ms |
| Variance | 0.006 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 6.21] ms

0.00 - 0.62 | ######################################## (9996)
0.62 - 1.24 |  (2)
1.24 - 1.86 |  (0)
1.86 - 2.48 |  (0)
2.48 - 3.10 |  (0)
3.10 - 3.73 |  (0)
3.73 - 4.35 |  (0)
4.35 - 4.97 |  (1)
4.97 - 5.59 |  (0)
5.59 - 6.21 |  (1)
```


### PlayerEntity: Full update

Full player update (all components)

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 18.19ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.003 ms |
| Max | 7.132 ms |
| Average | 0.009 ms |
| Median | 0.005 ms |
| P95 | 0.007 ms |
| P99 | 0.016 ms |
| Std Dev | 0.159 ms |
| Variance | 0.025 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 7.13] ms

0.00 - 0.72 | ######################################## (1999)
0.72 - 1.43 |  (0)
1.43 - 2.14 |  (0)
2.14 - 2.85 |  (0)
2.85 - 3.57 |  (0)
3.57 - 4.28 |  (0)
4.28 - 4.99 |  (0)
4.99 - 5.71 |  (0)
5.71 - 6.42 |  (0)
6.42 - 7.13 |  (1)
```


### PlayerEntity: render.addTrailPoint

Add trail point to render component

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 28.16ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.001 ms |
| Max | 8.553 ms |
| Average | 0.003 ms |
| Median | 0.001 ms |
| P95 | 0.002 ms |
| P99 | 0.004 ms |
| Std Dev | 0.091 ms |
| Variance | 0.008 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 8.55] ms

0.00 - 0.86 | ######################################## (9997)
0.86 - 1.71 |  (1)
1.71 - 2.57 |  (1)
2.57 - 3.42 |  (0)
3.42 - 4.28 |  (0)
4.28 - 5.13 |  (0)
5.13 - 5.99 |  (0)
5.99 - 6.84 |  (0)
6.84 - 7.70 |  (0)
7.70 - 8.55 |  (1)
```


### PlayerEntity: render.updateTrail

Update render trail based on movement

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 18.11ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.002 ms |
| Max | 0.678 ms |
| Average | 0.003 ms |
| Median | 0.003 ms |
| P95 | 0.005 ms |
| P99 | 0.007 ms |
| Std Dev | 0.010 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 0.68] ms

0.00 - 0.07 | ######################################## (4996)
0.07 - 0.14 |  (3)
0.14 - 0.20 |  (0)
0.20 - 0.27 |  (0)
0.27 - 0.34 |  (0)
0.34 - 0.41 |  (0)
0.41 - 0.47 |  (0)
0.47 - 0.54 |  (0)
0.54 - 0.61 |  (0)
0.61 - 0.68 |  (1)
```


### PlayerEntity: render.setColor

Set player color

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 29.10ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.002 ms |
| Max | 1.484 ms |
| Average | 0.003 ms |
| Median | 0.002 ms |
| P95 | 0.003 ms |
| P99 | 0.006 ms |
| Std Dev | 0.017 ms |
| Variance | 0.000 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.48] ms

0.00 - 0.15 | ######################################## (9997)
0.15 - 0.30 |  (1)
0.30 - 0.45 |  (0)
0.45 - 0.59 |  (0)
0.59 - 0.74 |  (1)
0.74 - 0.89 |  (0)
0.89 - 1.04 |  (0)
1.04 - 1.19 |  (0)
1.19 - 1.34 |  (0)
1.34 - 1.48 |  (1)
```


### PlayerEntity: render.clearTrail

Clear render trail

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 29.14ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.007 ms |
| Max | 6.071 ms |
| Average | 0.014 ms |
| Median | 0.009 ms |
| P95 | 0.012 ms |
| P99 | 0.023 ms |
| Std Dev | 0.146 ms |
| Variance | 0.021 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 6.07] ms

0.01 - 0.61 | ######################################## (1997)
0.61 - 1.22 |  (0)
1.22 - 1.83 |  (1)
1.83 - 2.43 |  (1)
2.43 - 3.04 |  (0)
3.04 - 3.65 |  (0)
3.65 - 4.25 |  (0)
4.25 - 4.86 |  (0)
4.86 - 5.46 |  (0)
5.46 - 6.07 |  (1)
```


### PlayerEntity: state.transition (ALIVE->DEAD)

Transition from ALIVE to DEAD

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 39.99ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 8.604 ms |
| Average | 0.008 ms |
| Median | 0.002 ms |
| P95 | 0.006 ms |
| P99 | 0.010 ms |
| Std Dev | 0.173 ms |
| Variance | 0.030 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 8.60] ms

0.00 - 0.86 | ######################################## (4994)
0.86 - 1.72 |  (2)
1.72 - 2.58 |  (1)
2.58 - 3.44 |  (1)
3.44 - 4.30 |  (0)
4.30 - 5.16 |  (0)
5.16 - 6.02 |  (0)
6.02 - 6.88 |  (0)
6.88 - 7.74 |  (1)
7.74 - 8.60 |  (1)
```


### PlayerEntity: state.respawn cycle

Full respawn cycle

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 56.16ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.008 ms |
| Max | 5.465 ms |
| Average | 0.028 ms |
| Median | 0.014 ms |
| P95 | 0.024 ms |
| P99 | 0.054 ms |
| Std Dev | 0.199 ms |
| Variance | 0.040 |

**Distribution (ASCII Histogram):**

```
Range: [0.01, 5.47] ms

0.01 - 0.55 | ######################################## (1991)
0.55 - 1.10 |  (1)
1.10 - 1.65 |  (2)
1.65 - 2.19 |  (2)
2.19 - 2.74 |  (1)
2.74 - 3.28 |  (0)
3.28 - 3.83 |  (1)
3.83 - 4.37 |  (1)
4.37 - 4.92 |  (0)
4.92 - 5.47 |  (1)
```


### PlayerEntity: state.setBoosting

Toggle boost state

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 29.51ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 6.732 ms |
| Average | 0.006 ms |
| Median | 0.002 ms |
| P95 | 0.004 ms |
| P99 | 0.008 ms |
| Std Dev | 0.117 ms |
| Variance | 0.014 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 6.73] ms

0.00 - 0.67 | ######################################## (4995)
0.67 - 1.35 |  (1)
1.35 - 2.02 |  (1)
2.02 - 2.69 |  (1)
2.69 - 3.37 |  (0)
3.37 - 4.04 |  (1)
4.04 - 4.71 |  (0)
4.71 - 5.39 |  (0)
5.39 - 6.06 |  (0)
6.06 - 6.73 |  (1)
```


### PlayerEntity: state.canTransition

Check valid state transitions

**Configuration:**
- Iterations: 10000
- Warmup: 100
- Total Duration: 17.33ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 10000 |
| Min | 0.001 ms |
| Max | 2.594 ms |
| Average | 0.002 ms |
| Median | 0.001 ms |
| P95 | 0.001 ms |
| P99 | 0.004 ms |
| Std Dev | 0.030 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 2.59] ms

0.00 - 0.26 | ######################################## (9996)
0.26 - 0.52 |  (0)
0.52 - 0.78 |  (1)
0.78 - 1.04 |  (1)
1.04 - 1.30 |  (1)
1.30 - 1.56 |  (0)
1.56 - 1.82 |  (0)
1.82 - 2.08 |  (0)
2.08 - 2.33 |  (0)
2.33 - 2.59 |  (1)
```


### PlayerEntity: physics.toJSON

Serialize physics component

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 11.07ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 1.965 ms |
| Average | 0.002 ms |
| Median | 0.001 ms |
| P95 | 0.002 ms |
| P99 | 0.005 ms |
| Std Dev | 0.037 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.96] ms

0.00 - 0.20 | ######################################## (4997)
0.20 - 0.39 |  (0)
0.39 - 0.59 |  (0)
0.59 - 0.79 |  (1)
0.79 - 0.98 |  (0)
0.98 - 1.18 |  (0)
1.18 - 1.38 |  (0)
1.38 - 1.57 |  (0)
1.57 - 1.77 |  (1)
1.77 - 1.96 |  (1)
```


### PlayerEntity: rubber.toJSON

Serialize rubber component

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 12.08ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 1.975 ms |
| Average | 0.002 ms |
| Median | 0.001 ms |
| P95 | 0.002 ms |
| P99 | 0.004 ms |
| Std Dev | 0.038 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.98] ms

0.00 - 0.20 | ######################################## (4997)
0.20 - 0.40 |  (0)
0.40 - 0.59 |  (0)
0.59 - 0.79 |  (1)
0.79 - 0.99 |  (0)
0.99 - 1.19 |  (0)
1.19 - 1.38 |  (0)
1.38 - 1.58 |  (0)
1.58 - 1.78 |  (1)
1.78 - 1.98 |  (1)
```


### PlayerEntity: render.toJSON

Serialize render component

**Configuration:**
- Iterations: 2000
- Warmup: 100
- Total Duration: 10.31ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 2000 |
| Min | 0.001 ms |
| Max | 4.472 ms |
| Average | 0.005 ms |
| Median | 0.002 ms |
| P95 | 0.005 ms |
| P99 | 0.006 ms |
| Std Dev | 0.102 ms |
| Variance | 0.010 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 4.47] ms

0.00 - 0.45 | ######################################## (1998)
0.45 - 0.90 |  (0)
0.90 - 1.34 |  (1)
1.34 - 1.79 |  (0)
1.79 - 2.24 |  (0)
2.24 - 2.68 |  (0)
2.68 - 3.13 |  (0)
3.13 - 3.58 |  (0)
3.58 - 4.03 |  (0)
4.03 - 4.47 |  (1)
```


### PlayerEntity: physics.fromJSON

Deserialize physics component

**Configuration:**
- Iterations: 5000
- Warmup: 100
- Total Duration: 10.64ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 5000 |
| Min | 0.001 ms |
| Max | 1.230 ms |
| Average | 0.002 ms |
| Median | 0.001 ms |
| P95 | 0.002 ms |
| P99 | 0.005 ms |
| Std Dev | 0.023 ms |
| Variance | 0.001 |

**Distribution (ASCII Histogram):**

```
Range: [0.00, 1.23] ms

0.00 - 0.12 | ######################################## (4996)
0.12 - 0.25 |  (1)
0.25 - 0.37 |  (0)
0.37 - 0.49 |  (0)
0.49 - 0.62 |  (0)
0.62 - 0.74 |  (1)
0.74 - 0.86 |  (1)
0.86 - 0.98 |  (0)
0.98 - 1.11 |  (0)
1.11 - 1.23 |  (1)
```


### FrameTime: 10 players (physics + rubber)

Simulate frame with 10 players

**Configuration:**
- Iterations: 1000
- Warmup: 100
- Total Duration: 51.50ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 1000 |
| Min | 0.018 ms |
| Max | 2.398 ms |
| Average | 0.051 ms |
| Median | 0.046 ms |
| P95 | 0.064 ms |
| P99 | 0.418 ms |
| Std Dev | 0.133 ms |
| Variance | 0.018 |

**Distribution (ASCII Histogram):**

```
Range: [0.02, 2.40] ms

0.02 - 0.26 | ######################################## (989)
0.26 - 0.49 |  (1)
0.49 - 0.73 |  (1)
0.73 - 0.97 |  (0)
0.97 - 1.21 |  (2)
1.21 - 1.45 |  (6)
1.45 - 1.68 |  (0)
1.68 - 1.92 |  (0)
1.92 - 2.16 |  (0)
2.16 - 2.40 |  (1)
```


### FrameTime: 50 players (physics + rubber)

Simulate frame with 50 players

**Configuration:**
- Iterations: 200
- Warmup: 100
- Total Duration: 72.39ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 200 |
| Min | 0.274 ms |
| Max | 3.378 ms |
| Average | 0.361 ms |
| Median | 0.333 ms |
| P95 | 0.422 ms |
| P99 | 0.699 ms |
| Std Dev | 0.231 ms |
| Variance | 0.053 |

**Distribution (ASCII Histogram):**

```
Range: [0.27, 3.38] ms

0.27 - 0.58 | ######################################## (197)
0.58 - 0.89 |  (1)
0.89 - 1.21 |  (0)
1.21 - 1.52 |  (1)
1.52 - 1.83 |  (0)
1.83 - 2.14 |  (0)
2.14 - 2.45 |  (0)
2.45 - 2.76 |  (0)
2.76 - 3.07 |  (0)
3.07 - 3.38 |  (1)
```


### FrameTime: 10 players (with trail render)

Simulate frame with trail rendering

**Configuration:**
- Iterations: 500
- Warmup: 100
- Total Duration: 86.87ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 500 |
| Min | 0.109 ms |
| Max | 2.891 ms |
| Average | 0.173 ms |
| Median | 0.134 ms |
| P95 | 0.246 ms |
| P99 | 0.864 ms |
| Std Dev | 0.167 ms |
| Variance | 0.028 |

**Distribution (ASCII Histogram):**

```
Range: [0.11, 2.89] ms

0.11 - 0.39 | ######################################## (485)
0.39 - 0.67 |  (5)
0.67 - 0.94 |  (5)
0.94 - 1.22 |  (4)
1.22 - 1.50 |  (0)
1.50 - 1.78 |  (0)
1.78 - 2.06 |  (0)
2.06 - 2.33 |  (0)
2.33 - 2.61 |  (0)
2.61 - 2.89 |  (1)
```


### FrameTime: Budget check (100 entities)

Check if 100 entities fit in 60fps budget

**Configuration:**
- Iterations: 100
- Warmup: 100
- Total Duration: 18.77ms

**Statistics:**
| Metric | Value |
|--------|-------|
| Count | 100 |
| Min | 0.066 ms |
| Max | 2.349 ms |
| Average | 0.187 ms |
| Median | 0.089 ms |
| P95 | 1.265 ms |
| P99 | 1.743 ms |
| Std Dev | 0.374 ms |
| Variance | 0.140 |

**Distribution (ASCII Histogram):**

```
Range: [0.07, 2.35] ms

0.07 - 0.29 | ######################################## (93)
0.29 - 0.52 |  (0)
0.52 - 0.75 |  (0)
0.75 - 0.98 |  (0)
0.98 - 1.21 |  (0)
1.21 - 1.44 | ## (5)
1.44 - 1.66 |  (0)
1.66 - 1.89 |  (1)
1.89 - 2.12 |  (0)
2.12 - 2.35 |  (1)
```


## Recommendations

- **TrailEntity: addPoint (single)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: addPoint (single)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: addPoint (10 points)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: addPoint (10 points)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: addPoint (100 points)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: addPoint (100 points)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: addPoint (1000 points, maxLength=200)**: Render operations taking >0.5ms. Consider batching or reducing geometry complexity.
- **TrailEntity: addPoint (with spacing check)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: addPoint (with spacing check)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: getRenderData (10 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: getRenderData (10 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: getRenderData (50 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: getRenderData (50 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: getRenderData (100 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: getRenderData (200 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: getRenderData (200 segments)**: Render operations taking >0.5ms. Consider batching or reducing geometry complexity.
- **TrailEntity: getRenderData (repeated, 50 segments)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: getRenderData (repeated, 50 segments)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: getSegments (100 points)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: getSegments (100 points)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **TrailEntity: trimToLength**: Render operations taking >0.5ms. Consider batching or reducing geometry complexity.
- **TrailEntity: getCollisionSegments**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **TrailEntity: getCollisionSegments**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: Create**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: Create**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: Create 10 players**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: Create 10 players**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: Create 100 players**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: physics.update**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: physics.update**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: rubber.update**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: rubber.update**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: state.update**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: state.update**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: Full update**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: Full update**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: render.addTrailPoint**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: render.addTrailPoint**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: render.updateTrail**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: render.updateTrail**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: render.setColor**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: render.setColor**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: render.clearTrail**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: render.clearTrail**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: state.transition (ALIVE->DEAD)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: state.transition (ALIVE->DEAD)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: state.respawn cycle**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: state.respawn cycle**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: state.setBoosting**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: state.setBoosting**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: state.canTransition**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: state.canTransition**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: physics.toJSON**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: physics.toJSON**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: rubber.toJSON**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: rubber.toJSON**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: render.toJSON**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: render.toJSON**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **PlayerEntity: physics.fromJSON**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **PlayerEntity: physics.fromJSON**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **FrameTime: 10 players (physics + rubber)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **FrameTime: 10 players (physics + rubber)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **FrameTime: 50 players (physics + rubber)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **FrameTime: 50 players (physics + rubber)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **FrameTime: 10 players (with trail render)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
- **FrameTime: 10 players (with trail render)**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.
- **FrameTime: Budget check (100 entities)**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.
