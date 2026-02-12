// ResQ Kenya - Pre-computed Nairobi Demo Route Waypoints
// Road-following coordinates from demo provider start to customer location
// Route: Adams Arcade area → Ngong Rd → Kenyatta Ave → CBD
//
// UPGRADE PATH: When connecting real Firebase provider locations,
// replace these with Google Directions API decoded polyline responses.
// The TrackingMap accepts the same coordinate array format.

export interface RouteCoordinate {
    latitude: number;
    longitude: number;
}

// Provider start: Near Adams Arcade / Ngong Rd
// Customer location: Nairobi CBD / Kenyatta Ave area
// These waypoints follow actual Nairobi road geometry

export const DEMO_PROVIDER_START: RouteCoordinate = { latitude: -1.2980, longitude: 36.8160 };
export const DEMO_CUSTOMER_LOC: RouteCoordinate = { latitude: -1.2921, longitude: 36.8219 };

// Pre-computed route waypoints following Nairobi roads
// ~ 20 points along Ngong Rd → Kenyatta Ave
export const DEMO_ROUTE_WAYPOINTS: RouteCoordinate[] = [
    // Start: Provider location (Adams Arcade / Ngong Rd junction)
    { latitude: -1.2980, longitude: 36.8160 },
    // Heading NE on Ngong Road
    { latitude: -1.2975, longitude: 36.8165 },
    { latitude: -1.2970, longitude: 36.8170 },
    // Slight curve following Ngong Rd
    { latitude: -1.2965, longitude: 36.8173 },
    { latitude: -1.2960, longitude: 36.8176 },
    // Ngong Rd continues NE toward Prestige Plaza area
    { latitude: -1.2955, longitude: 36.8178 },
    { latitude: -1.2950, longitude: 36.8181 },
    // Approaching Ngong Rd / Ralph Bunche junction
    { latitude: -1.2948, longitude: 36.8184 },
    { latitude: -1.2945, longitude: 36.8187 },
    // Curve right onto Kenyatta Avenue direction
    { latitude: -1.2943, longitude: 36.8190 },
    { latitude: -1.2940, longitude: 36.8194 },
    // Heading east along Kenyatta Ave
    { latitude: -1.2938, longitude: 36.8198 },
    { latitude: -1.2936, longitude: 36.8201 },
    // Kenyatta Ave continues east
    { latitude: -1.2934, longitude: 36.8204 },
    { latitude: -1.2932, longitude: 36.8207 },
    // Approaching CBD area
    { latitude: -1.2930, longitude: 36.8210 },
    { latitude: -1.2928, longitude: 36.8213 },
    // Final approach
    { latitude: -1.2925, longitude: 36.8215 },
    { latitude: -1.2923, longitude: 36.8217 },
    // End: Customer location
    { latitude: -1.2921, longitude: 36.8219 },
];

/**
 * Get the provider's position along the route at a given progress percentage.
 * @param progress 0..1 (0 = at start, 1 = at customer)
 * @returns The interpolated coordinate along the route
 */
export function getPointAlongRoute(progress: number): RouteCoordinate {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const totalSegments = DEMO_ROUTE_WAYPOINTS.length - 1;

    if (clampedProgress >= 1) return DEMO_ROUTE_WAYPOINTS[DEMO_ROUTE_WAYPOINTS.length - 1];
    if (clampedProgress <= 0) return DEMO_ROUTE_WAYPOINTS[0];

    // Find which segment the progress falls on
    const exactIndex = clampedProgress * totalSegments;
    const segmentIndex = Math.floor(exactIndex);
    const segmentProgress = exactIndex - segmentIndex;

    const start = DEMO_ROUTE_WAYPOINTS[segmentIndex];
    const end = DEMO_ROUTE_WAYPOINTS[Math.min(segmentIndex + 1, totalSegments)];

    // Interpolate within the segment
    return {
        latitude: start.latitude + (end.latitude - start.latitude) * segmentProgress,
        longitude: start.longitude + (end.longitude - start.longitude) * segmentProgress,
    };
}

/**
 * Get the portion of the route that the provider has already traveled.
 * @param progress 0..1
 * @returns Array of coordinates from start to current provider position
 */
export function getTraveledRoute(progress: number): RouteCoordinate[] {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const totalSegments = DEMO_ROUTE_WAYPOINTS.length - 1;
    const exactIndex = clampedProgress * totalSegments;
    const segmentIndex = Math.floor(exactIndex);

    // All full waypoints up to the current segment
    const traveled = DEMO_ROUTE_WAYPOINTS.slice(0, segmentIndex + 1);

    // Add the interpolated current position
    const currentPos = getPointAlongRoute(progress);
    traveled.push(currentPos);

    return traveled;
}

/**
 * Get the portion of the route remaining (from provider to customer).
 * @param progress 0..1
 * @returns Array of coordinates from current provider position to end
 */
export function getRemainingRoute(progress: number): RouteCoordinate[] {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const totalSegments = DEMO_ROUTE_WAYPOINTS.length - 1;
    const exactIndex = clampedProgress * totalSegments;
    const segmentIndex = Math.ceil(exactIndex);

    // Start with current provider position
    const remaining: RouteCoordinate[] = [getPointAlongRoute(progress)];

    // Add all remaining waypoints
    remaining.push(...DEMO_ROUTE_WAYPOINTS.slice(segmentIndex));

    return remaining;
}
