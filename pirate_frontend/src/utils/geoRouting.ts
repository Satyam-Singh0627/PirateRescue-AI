// Caribbean Sea Routing & Ship Route Interpolation Engine
// Provides guaranteed sea-only paths around landmasses and continuous interpolation

export type LatLon = [number, number];

export interface RouteWaypoint {
  lat: number;
  lon: number;
  stepIndex: number;
  isStop: boolean;
  islandId?: string;
  locationName: string;
}

// Bounding boxes for Caribbean landmasses [minLat, maxLat, minLon, maxLon, name]
const LAND_BOXES: [number, number, number, number, string][] = [
  [22.0, 23.5, -84.9, -78.0, 'Cuba-West'],
  [19.8, 22.0, -78.0, -74.1, 'Cuba-East'],
  [18.2, 20.1, -74.5, -71.5, 'Haiti'],
  [18.0, 20.0, -71.5, -68.3, 'DomRep'],
  [17.9, 18.6, -67.3, -65.5, 'PuertoRico'],
  [17.7, 18.5, -78.3, -76.1, 'Jamaica'],
  [24.5, 31.5, -87.7, -79.8, 'Florida'],
];

// Strategic deep-water maritime navigation waypoints
const WP = {
  WINDWARD:    [19.9, -73.7] as LatLon, // Windward Passage between Cuba & Haiti
  MONA:        [18.2, -67.6] as LatLon, // Mona Passage between Hispaniola & Puerto Rico
  CAYMAN_SEA:  [19.2, -81.5] as LatLon, // South around Cuba via Cayman Trench
  OLD_BAHAMA:  [22.8, -79.5] as LatLon, // North of Cuba through Old Bahama Channel
  S_HISPANIOLA:[16.5, -72.0] as LatLon, // Deep sea south of Hispaniola
  S_JAMAICA:   [17.5, -77.0] as LatLon, // Deep sea south of Jamaica / Port Royal
};

function segHitsBox(
  lat1: number, lon1: number, lat2: number, lon2: number,
  minLat: number, maxLat: number, minLon: number, maxLon: number
): boolean {
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const p = [-dx, dx, -dy, dy];
  const q = [lon1 - minLon, maxLon - lon1, lat1 - minLat, maxLat - lat1];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return true;
}

function blockers(from: LatLon, to: LatLon): Set<string> {
  const s = new Set<string>();
  LAND_BOXES.forEach(([minLat, maxLat, minLon, maxLon, name]) => {
    if (segHitsBox(from[0], from[1], to[0], to[1], minLat, maxLat, minLon, maxLon)) {
      s.add(name);
    }
  });
  return s;
}

export function seaRouteSegment(from: LatLon, to: LatLon): LatLon[] {
  const bl = blockers(from, to);
  if (bl.size === 0) return [from, to];

  const toLon = to[1];
  const path: LatLon[] = [from];

  if (bl.has('Cuba-West') || bl.has('Cuba-East')) {
    path.push(toLon < -80 ? WP.CAYMAN_SEA : (toLon > -76 ? WP.WINDWARD : WP.OLD_BAHAMA));
  }
  if (bl.has('Haiti') || bl.has('DomRep')) {
    if (path.length === 1) {
      if (toLon > -68.5) {
        path.push(WP.WINDWARD);
        if (blockers(WP.WINDWARD, to).size > 0) path.push(WP.MONA);
      } else if (to[0] < 16.5) {
        path.push(WP.S_HISPANIOLA);
      } else {
        path.push(WP.WINDWARD);
      }
    }
  }
  if (bl.has('PuertoRico')) {
    const lastPt = path[path.length - 1];
    if (blockers(lastPt, to).has('PuertoRico')) {
      path.push(WP.MONA);
    }
  }

  path.push(to);
  return path;
}

// Great-circle distance in nautical miles
export function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in NM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bearing in degrees
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface DetailedRoutePath {
  ship_id: string;
  coordinates: LatLon[]; // Full ordered array of coordinates for Leaflet polyline
  segments: {
    fromStepIndex: number;
    toStepIndex: number;
    points: LatLon[];
    legDistanceNm: number;
    departureMinute: number;
    arrivalMinute: number;
    fromLocation: string;
    toLocation: string;
  }[];
}

/**
 * Builds the canonical sea-safe detailed route for a ship route.
 * Both the Leaflet polyline renderer AND the ship movement simulation MUST use this.
 */
export function buildDetailedRoutePath(route: any): DetailedRoutePath {
  const steps = route.steps || [];
  if (steps.length === 0) {
    return { ship_id: route.ship_id, coordinates: [], segments: [] };
  }
  if (steps.length === 1) {
    const pt: LatLon = [steps[0].latitude, steps[0].longitude];
    return {
      ship_id: route.ship_id,
      coordinates: [pt],
      segments: [],
    };
  }

  const allCoordinates: LatLon[] = [];
  const segments: DetailedRoutePath['segments'] = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const s1 = steps[i];
    const s2 = steps[i + 1];
    const fromPt: LatLon = [s1.latitude, s1.longitude];
    const toPt: LatLon = [s2.latitude, s2.longitude];

    const segPoints = seaRouteSegment(fromPt, toPt);

    let segDist = 0;
    for (let k = 0; k < segPoints.length - 1; k++) {
      segDist += distanceNm(
        segPoints[k][0], segPoints[k][1],
        segPoints[k + 1][0], segPoints[k + 1][1]
      );
    }

    segments.push({
      fromStepIndex: i,
      toStepIndex: i + 1,
      points: segPoints,
      legDistanceNm: segDist,
      departureMinute: s1.departure_time_minutes ?? 0,
      arrivalMinute: s2.arrival_time_minutes ?? (s1.departure_time_minutes + 60),
      fromLocation: s1.location_name || 'Port',
      toLocation: s2.location_name || 'Destination',
    });

    if (i === 0) {
      allCoordinates.push(...segPoints);
    } else {
      allCoordinates.push(...segPoints.slice(1));
    }
  }

  return {
    ship_id: route.ship_id,
    coordinates: allCoordinates,
    segments,
  };
}

export interface SimulatedShipState {
  ship_id: string;
  latitude: number;
  longitude: number;
  bearing: number;
  current_load: number;
  status: 'DOCKED' | 'DEPLOYED' | 'ARRIVED' | 'RESCUE_OPS' | 'MISSION_COMPLETE';
  statusText: string;
  currentStopName: string;
  targetStopName: string;
  visitedStepIndices: number[];
  visitedIslandIds: string[];
  rescuedCount: number;
}

/**
 * Computes exact interpolated ship state at any simulation minute along the detailed path.
 */
export function interpolateShipPosition(
  detailedPath: DetailedRoutePath,
  route: any,
  simMinutes: number
): SimulatedShipState {
  const steps = route.steps || [];
  const defaultPt: LatLon = steps[0] ? [steps[0].latitude, steps[0].longitude] : [17.936, -76.841];

  if (steps.length === 0 || detailedPath.segments.length === 0) {
    return {
      ship_id: route.ship_id,
      latitude: defaultPt[0],
      longitude: defaultPt[1],
      bearing: 0,
      current_load: 0,
      status: 'DOCKED',
      statusText: 'DOCKED',
      currentStopName: steps[0]?.location_name || 'Base Port',
      targetStopName: '',
      visitedStepIndices: [],
      visitedIslandIds: [],
      rescuedCount: 0,
    };
  }

  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];

  // Before departure
  if (simMinutes <= (firstStep.departure_time_minutes ?? 0)) {
    return {
      ship_id: route.ship_id,
      latitude: firstStep.latitude,
      longitude: firstStep.longitude,
      bearing: 0,
      current_load: 0,
      status: 'DOCKED',
      statusText: 'DOCKED',
      currentStopName: firstStep.location_name,
      targetStopName: steps[1]?.location_name || '',
      visitedStepIndices: [0],
      visitedIslandIds: [],
      rescuedCount: 0,
    };
  }

  // After mission complete
  if (simMinutes >= (lastStep.arrival_time_minutes ?? 999999)) {
    const rescuedIds = steps
      .filter((s: any) => s.action === 'RESCUE')
      .map((s: any) => s.location_id);
    return {
      ship_id: route.ship_id,
      latitude: lastStep.latitude,
      longitude: lastStep.longitude,
      bearing: 0,
      current_load: route.total_rescued || lastStep.cumulative_load || 0,
      status: 'MISSION_COMPLETE',
      statusText: 'MISSION COMPLETE',
      currentStopName: lastStep.location_name,
      targetStopName: '',
      visitedStepIndices: steps.map((_: any, i: number) => i),
      visitedIslandIds: rescuedIds,
      rescuedCount: route.total_rescued || 0,
    };
  }

  // Inside route timeline
  const visitedStepIndices: number[] = [0];
  const visitedIslandIds: string[] = [];
  let currentLoad = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (simMinutes >= (step.arrival_time_minutes ?? 0)) {
      if (!visitedStepIndices.includes(i)) visitedStepIndices.push(i);
      if (step.action === 'RESCUE' && step.location_id) {
        if (!visitedIslandIds.includes(step.location_id)) {
          visitedIslandIds.push(step.location_id);
        }
      }
      currentLoad = step.cumulative_load ?? currentLoad;
    }
  }

  // Check if docked / operating at any step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const arr = step.arrival_time_minutes ?? 0;
    const dep = step.departure_time_minutes ?? arr;

    if (simMinutes >= arr && simMinutes <= dep) {
      const isRescue = step.action === 'RESCUE';
      const status = isRescue ? 'ARRIVED' : 'DOCKED';
      const statusText = isRescue ? 'ARRIVED' : 'DOCKED';

      return {
        ship_id: route.ship_id,
        latitude: step.latitude,
        longitude: step.longitude,
        bearing: 0,
        current_load: step.cumulative_load ?? currentLoad,
        status,
        statusText,
        currentStopName: step.location_name,
        targetStopName: steps[i + 1]?.location_name || 'Base Port',
        visitedStepIndices,
        visitedIslandIds,
        rescuedCount: currentLoad,
      };
    }
  }

  // In transit between two steps
  for (let segIdx = 0; segIdx < detailedPath.segments.length; segIdx++) {
    const seg = detailedPath.segments[segIdx];
    if (simMinutes > seg.departureMinute && simMinutes < seg.arrivalMinute) {
      const segDuration = Math.max(0.1, seg.arrivalMinute - seg.departureMinute);
      const frac = Math.max(0, Math.min(1, (simMinutes - seg.departureMinute) / segDuration));

      const pts = seg.points;
      if (pts.length <= 1) {
        return {
          ship_id: route.ship_id,
          latitude: pts[0][0],
          longitude: pts[0][1],
          bearing: 0,
          current_load: currentLoad,
          status: 'DEPLOYED',
          statusText: 'DEPLOYED',
          currentStopName: seg.fromLocation,
          targetStopName: seg.toLocation,
          visitedStepIndices,
          visitedIslandIds,
          rescuedCount: currentLoad,
        };
      }

      const subDists: number[] = [0];
      for (let k = 0; k < pts.length - 1; k++) {
        const d = distanceNm(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]);
        subDists.push(subDists[k] + d);
      }
      const totalSegDist = subDists[subDists.length - 1];
      const targetDist = frac * totalSegDist;

      let subIdx = 0;
      while (subIdx < subDists.length - 1 && subDists[subIdx + 1] < targetDist) {
        subIdx++;
      }

      const pA = pts[subIdx];
      const pB = pts[Math.min(subIdx + 1, pts.length - 1)];
      const dSub = Math.max(0.0001, subDists[subIdx + 1] - subDists[subIdx]);
      const subFrac = Math.max(0, Math.min(1, (targetDist - subDists[subIdx]) / dSub));

      const lat = pA[0] + (pB[0] - pA[0]) * subFrac;
      const lon = pA[1] + (pB[1] - pA[1]) * subFrac;
      const bearing = calculateBearing(pA[0], pA[1], pB[0], pB[1]);

      return {
        ship_id: route.ship_id,
        latitude: lat,
        longitude: lon,
        bearing,
        current_load: currentLoad,
        status: 'DEPLOYED',
        statusText: 'DEPLOYED',
        currentStopName: seg.fromLocation,
        targetStopName: seg.toLocation,
        visitedStepIndices,
        visitedIslandIds,
        rescuedCount: currentLoad,
      };
    }
  }

  return {
    ship_id: route.ship_id,
    latitude: lastStep.latitude,
    longitude: lastStep.longitude,
    bearing: 0,
    current_load: currentLoad,
    status: 'DEPLOYED',
    statusText: 'DEPLOYED',
    currentStopName: lastStep.location_name,
    targetStopName: '',
    visitedStepIndices,
    visitedIslandIds,
    rescuedCount: currentLoad,
  };
}
