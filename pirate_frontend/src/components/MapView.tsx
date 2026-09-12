import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Island, RescueShip, BasePort, RescuePlan } from '../types';
import { buildDetailedRoutePath, DetailedRoutePath, SimulatedShipState } from '../utils/geoRouting';

interface MapViewProps {
  basePort: BasePort | null;
  islands: Island[];
  ships: RescueShip[];
  plan: RescuePlan | null;
  simulatedShips?: SimulatedShipState[];
  isSimulationActive: boolean;
  detailedRoutePaths?: DetailedRoutePath[];
  rescuedIslandIds?: string[];
}

// Classy maritime route palette (warm teal, terracotta, gold, slate)
const ROUTE_COLORS = [
  '#3D8190', // Muted Route Teal
  '#B96F5B', // Terracotta
  '#B8954A', // Muted Gold
  '#4A6B82', // Navy Slate
  '#8C5E58', // Rosewood
  '#3E9B72', // Sea Green
  '#8F6A99', // Dusty Plum
  '#C77E4A', // Amber Amber
];

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: '#C94C4C',
  HIGH:     '#D9824B',
  MEDIUM:   '#C7A33A',
  LOW:      '#3E9B72',
};

export const MapView: React.FC<MapViewProps> = ({
  basePort,
  islands,
  ships,
  plan,
  simulatedShips,
  isSimulationActive,
  detailedRoutePaths,
  rescuedIslandIds = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const staticLgRef  = useRef<L.LayerGroup | null>(null);
  const shipsLgRef   = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map with standard OpenStreetMap (100% free, 0 API keys required)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [18.5, -73.5],
      zoom: 6,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false,
    });

    // Standard OpenStreetMap - completely free, no watermark, no API key required
    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }
    ).addTo(map);

    // Zoom control in top-right so bottom-right is clear for map key
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups: static elements (routes, ports, islands) & dynamic ship markers
    const staticLg = L.layerGroup().addTo(map);
    const shipsLg  = L.layerGroup().addTo(map);
    staticLgRef.current = staticLg;
    shipsLgRef.current  = shipsLg;
    mapRef.current      = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Render Static Map Elements (Base Port, Rescue Routes, Island Pins) ────
  useEffect(() => {
    const map = mapRef.current;
    const staticLg = staticLgRef.current;
    if (!map || !staticLg) return;

    staticLg.clearLayers();

    // 1. Base Port (Port Royal HQ)
    if (basePort) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 34px; height: 34px;
          background: #FFF9F4;
          border: 2.5px solid #172A3A;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(23, 42, 58, 0.25);
          font-size: 16px;
          color: #172A3A;
        ">⚓</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([basePort.latitude, basePort.longitude], { icon, zIndexOffset: 1000 })
        .addTo(staticLg)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 170px; font-size: 12px; color: #172A3A;">
            <b style="font-size: 13px;">⚓ ${basePort.name}</b><br/>
            <span style="color: #71808A;">Fleet Operations Headquarters</span><br/>
            <span style="font-size: 11px; color: #B96F5B; font-weight: 600;">Coord: ${basePort.latitude.toFixed(3)}°N, ${Math.abs(basePort.longitude).toFixed(3)}°W</span>
          </div>
        `);
    }

    // 2. Optimized Rescue Routes (SHARED SOURCE OF TRUTH WITH ANIMATION)
    if (plan?.routes) {
      plan.routes.forEach((route, idx) => {
        const detailedPath = detailedRoutePaths?.find(p => p.ship_id === route.ship_id)
          || buildDetailedRoutePath(route);

        const coords = detailedPath.coordinates;
        if (!coords || coords.length < 2) return;

        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];

        // Main rescue route polyline — exact coordinates shared with ship animation
        L.polyline(coords, {
          color,
          weight: 3.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        })
          .addTo(staticLg)
          .bindTooltip(
            `<div style="font-family: system-ui; min-width: 160px; font-size: 12px; color: #172A3A;">
              <b>${route.ship_name}</b><br/>
              ${route.steps.filter(s => s.action === 'RESCUE').length} rescue stops &nbsp;·&nbsp;
              ${route.total_rescued} souls &nbsp;·&nbsp;
              ${Number(route.total_distance_nm).toFixed(0)} nm
            </div>`,
            { sticky: true }
          );

        // Stop number badges along the route
        route.steps.filter(s => s.action === 'RESCUE').forEach((step, si) => {
          const stopIcon = L.divIcon({
            className: '',
            html: `<div style="
              background: ${color};
              color: #FFFFFF;
              width: 20px; height: 20px;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 10.5px; font-weight: 700;
              border: 2px solid #FFFFFF;
              box-shadow: 0 1px 5px rgba(23, 42, 58, 0.35);
            ">${si + 1}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          L.marker([step.latitude, step.longitude], { icon: stopIcon, zIndexOffset: 300 + si })
            .addTo(staticLg)
            .bindTooltip(`<b>Stop ${si + 1}: ${step.location_name}</b><br/>${route.ship_name}`, {
              direction: 'top',
              offset: [0, -12],
            });
        });
      });
    }

    // 3. Island Distress Markers
    islands.forEach((island) => {
      const urgency = (island.urgency_level || 'LOW').toUpperCase();
      const color = URGENCY_COLORS[urgency] || '#3E9B72';
      const isRescued = rescuedIslandIds.includes(island.id)
        || plan?.island_statuses.find(s => s.island_id === island.id)?.rescued;

      const isCritical = urgency === 'CRITICAL' && !isRescued;

      const icon = L.divIcon({
        className: '',
        html: `<div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          ${isCritical ? `<div style="
            position: absolute; inset: 0; border-radius: 50%;
            border: 2px solid ${color};
            opacity: 0.6;
            animation: distress-ping 2.5s ease-out infinite;
          "></div>` : ''}
          <div style="
            width: 24px; height: 24px; border-radius: 50%;
            background: ${isRescued ? '#3E9B72' : '#FFFFFF'};
            border: 2.5px solid ${isRescued ? '#3E9B72' : color};
            display: flex; align-items: center; justify-content: center;
            font-size: ${isRescued ? '12px' : '11px'};
            font-weight: 700;
            color: ${isRescued ? '#FFFFFF' : color};
            box-shadow: 0 2px 6px rgba(23, 42, 58, 0.2);
          ">${isRescued ? '✓' : '●'}</div>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const assignedRoute = plan?.routes.find(r =>
        r.steps.some(s => s.location_id === island.id && s.action === 'RESCUE')
      );

      L.marker([island.latitude, island.longitude], { icon, zIndexOffset: 200 })
        .addTo(staticLg)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 200px; font-size: 12.5px; color: #172A3A;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <b style="font-size: 13.5px;">${island.name}</b>
              <span style="
                font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 3px;
                background: ${isRescued ? 'rgba(62,155,114,0.15)' : 'rgba(23,42,58,0.06)'};
                color: ${isRescued ? '#3E9B72' : color};
              ">${isRescued ? 'RESCUED' : urgency}</span>
            </div>
            <div style="color: #4A5D6E; line-height: 1.6; font-size: 12px;">
              <b>${island.population}</b> survivors (${island.children_count} children, ${island.elderly_count} elderly, ${island.injured_count} injured)<br/>
              Priority Score: <b>${island.urgency_score.toFixed(0)}</b>
              ${island.medical_needs?.length ? `<br/>Medical Needs: ${island.medical_needs.join(', ')}` : ''}
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #EADBCE; font-size: 11px;">
                ${isRescued
                  ? `<span style="color: #3E9B72; font-weight: 600;">✓ Rescued by ${assignedRoute?.ship_name || 'Fleet'}</span>`
                  : `<span style="color: #D9824B;">⏳ ${assignedRoute ? `Assigned to ${assignedRoute.ship_name}` : 'Awaiting dispatch'}</span>`}
              </div>
            </div>
          </div>
        `);
    });

    // Fit bounds once on scenario load if no simulation is active
    if (!isSimulationActive) {
      const pts: [number, number][] = islands.map(i => [i.latitude, i.longitude]);
      if (basePort) pts.push([basePort.latitude, basePort.longitude]);
      if (pts.length > 0) {
        map.fitBounds(pts, { padding: [50, 50], maxZoom: 8 });
      }
    }
  }, [basePort, islands, plan, detailedRoutePaths, rescuedIslandIds, isSimulationActive]);

  // ── Render Dynamic Ship Markers (Realistic Nautical Vessel Shape + Clean Label) ────
  useEffect(() => {
    const shipsLg = shipsLgRef.current;
    if (!shipsLg) return;

    shipsLg.clearLayers();

    if (isSimulationActive && simulatedShips && simulatedShips.length > 0) {
      // Actively moving vessels along polyline
      simulatedShips.forEach((ss, idx) => {
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        const shipObj = ships.find(s => s.id === ss.ship_id);
        const name = shipObj?.name || ss.ship_id;
        const shortName = name.split(' ').pop();
        const statusLabel = ss.statusText || ss.status;

        // Authentic top-down naval rescue ship SVG oriented dynamically in the direction of sailing (bearing)
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 72px;
            cursor: pointer;
            pointer-events: auto;
          ">
            <!-- Realistic Vessel Hull pointing along route bearing -->
            <div style="
              width: 30px; height: 42px;
              display: flex; align-items: center; justify-content: center;
              transform: rotate(${ss.bearing}deg);
              transition: transform 0.15s ease-out;
            ">
              <svg width="26" height="38" viewBox="0 0 26 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(23,42,58,0.45));">
                <!-- Stern wake ripples when moving -->
                ${ss.status === 'DEPLOYED' ? `
                  <path d="M5 36 L1 40 M21 36 L25 40" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
                ` : ''}
                <!-- Outer Hull -->
                <path d="M13 2 C18 9, 23 20, 22 34 C22 36, 18 37, 13 37 C8 37, 4 36, 4 34 C3 20, 8 9, 13 2 Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
                <!-- Deck Superstructure -->
                <path d="M13 6 C16 12, 19 21, 19 32 C17 33, 15 33.5, 13 33.5 C11 33.5, 9 33, 7 32 C7 21, 10 12, 13 6 Z" fill="#FFFFFF" fill-opacity="0.25"/>
                <!-- Wheelhouse / Bridge Cabin -->
                <rect x="9.5" y="16" width="7" height="9" rx="1.5" fill="#FFFFFF" stroke="${color}" stroke-width="1.2"/>
                <!-- Forward Mast & Radar Dome -->
                <line x1="13" y1="10" x2="13" y2="16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="13" cy="9.5" r="1.5" fill="#FFFFFF"/>
                <circle cx="13" cy="20.5" r="1.8" fill="${color}"/>
                <!-- Port (red) & Starboard (green) Nav Lights -->
                <circle cx="5" cy="18" r="1.1" fill="#FF4D4D"/>
                <circle cx="21" cy="18" r="1.1" fill="#4DFF88"/>
              </svg>
            </div>

            <!-- Sleek compact callout badge underneath (no giant white box overlapping the map) -->
            <div style="
              margin-top: 3px;
              background: rgba(23, 42, 58, 0.9);
              color: #FFFFFF;
              border-radius: 4px;
              padding: 1px 6px;
              font-size: 9.5px;
              font-weight: 700;
              letter-spacing: 0.02em;
              white-space: nowrap;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              border: 1px solid rgba(255,255,255,0.25);
              line-height: 1.3;
              display: flex;
              align-items: center;
              gap: 3px;
            ">
              <span>${shortName}</span>
              ${ss.status !== 'DEPLOYED' ? `
                <span style="
                  font-size: 8px;
                  padding: 0 3px;
                  border-radius: 2px;
                  background: ${ss.status === 'ARRIVED' ? '#B96F5B' : ss.status === 'MISSION_COMPLETE' ? '#3E9B72' : 'rgba(255,255,255,0.2)'};
                  color: #FFFFFF;
                ">${statusLabel}</span>
              ` : ''}
            </div>
          </div>`,
          iconSize: [72, 56],
          iconAnchor: [36, 21],
        });

        L.marker([ss.latitude, ss.longitude], { icon, zIndexOffset: 950 })
          .addTo(shipsLg)
          .bindTooltip(
            `<b>${name}</b><br/>Status: <b>${statusLabel}</b><br/>Rescued on board: <b>${ss.current_load}</b>`,
            { direction: 'top', offset: [0, -14] }
          );
      });
    } else {
      // Docked vessels around Port Royal
      ships.forEach((ship, idx) => {
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        const angle = (idx / Math.max(1, ships.length)) * 2 * Math.PI;
        const r = 0.07;
        const lat = (basePort?.latitude || ship.latitude) + Math.sin(angle) * r;
        const lon = (basePort?.longitude || ship.longitude) + Math.cos(angle) * r;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 60px;
            cursor: pointer;
            pointer-events: auto;
          ">
            <div style="width: 24px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <svg width="22" height="32" viewBox="0 0 26 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(23,42,58,0.25));">
                <path d="M13 2 C18 9, 23 20, 22 34 C22 36, 18 37, 13 37 C8 37, 4 36, 4 34 C3 20, 8 9, 13 2 Z" fill="#FFFFFF" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
                <rect x="9.5" y="16" width="7" height="9" rx="1.5" fill="${color}"/>
                <circle cx="13" cy="9.5" r="1.5" fill="${color}"/>
              </svg>
            </div>
            <div style="
              margin-top: 2px;
              background: rgba(255, 255, 255, 0.92);
              border: 1px solid rgba(23, 42, 58, 0.18);
              border-radius: 3px;
              padding: 0 4px;
              font-size: 9px;
              font-weight: 600;
              color: #172A3A;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">${ship.name.split(' ').pop()}</div>
          </div>`,
          iconSize: [60, 48],
          iconAnchor: [30, 17],
        });

        L.marker([lat, lon], { icon, zIndexOffset: 600 })
          .addTo(shipsLg)
          .bindPopup(`
            <div style="font-family: system-ui; font-size: 12px; color: #172A3A;">
              <b>${ship.name}</b><br/>
              Type: ${ship.type}<br/>
              Max Capacity: <b>${ship.max_capacity}</b> souls<br/>
              Speed: <b>${ship.speed_knots} knots</b><br/>
              Status: <span style="color: #71808A; font-weight: 600;">DOCKED (PORT ROYAL)</span>
            </div>
          `);
      });
    }
  }, [ships, simulatedShips, isSimulationActive, basePort]);

  return (
    <div className="map-container-wrapper">
      <div className="map-viewport">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Fixed Horizontal Map Legend Strip (Below Map, Chart-Legend Style) ── */}
      <div className="map-legend-strip">
        <div className="map-legend-item">
          <span className="map-legend-symbol" style={{ fontSize: '13px', color: '#D4AF37' }}>⚓</span>
          <span className="map-legend-label">Port</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#C94C4C' }} />
          <span className="map-legend-label">Critical</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#D9824B' }} />
          <span className="map-legend-label">High</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#C7A33A' }} />
          <span className="map-legend-label">Medium</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot" style={{ background: '#3E9B72' }} />
          <span className="map-legend-label">Low / Saved</span>
        </div>
        <div className="map-legend-item">
          <span className="map-legend-line" style={{ background: '#3D8190' }} />
          <span className="map-legend-label">Route</span>
        </div>
      </div>
    </div>
  );
};
