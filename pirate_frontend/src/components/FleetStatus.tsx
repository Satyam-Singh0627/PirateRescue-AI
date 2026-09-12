import React from 'react';
import { Ship, Route, Anchor, Users } from 'lucide-react';
import { RescueShip, RescuePlan } from '../types';
import { SimulatedShipState } from '../utils/geoRouting';

interface FleetStatusProps {
  ships: RescueShip[];
  plan: RescuePlan | null;
  simulatedShips?: SimulatedShipState[];
  isSimulationActive?: boolean;
}

const VESSEL_COLORS: Record<number, string> = {
  0: '#3D8190', // Route Teal
  1: '#B96F5B', // Terracotta
  2: '#B8954A', // Gold
  3: '#4A6B82', // Navy Slate
  4: '#8C5E58', // Rosewood
  5: '#3E9B72', // Sea Green
  6: '#8F6A99', // Dusty Plum
  7: '#C77E4A', // Amber
};

export const FleetStatus: React.FC<FleetStatusProps> = ({
  ships,
  plan,
  simulatedShips = [],
  isSimulationActive = false,
}) => {
  const totalRescued = isSimulationActive && simulatedShips.length > 0
    ? simulatedShips.reduce((s, sh) => s + (sh.current_load || 0), 0)
    : (plan?.routes.reduce((s, r) => s + r.total_rescued, 0) ?? 0);

  const deployedCount = plan
    ? ships.filter(sh => plan.routes.find(r => r.ship_id === sh.id && r.steps.some(s => s.action === 'RESCUE'))).length
    : 0;
  const availableCount = ships.length - deployedCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* ── Fleet Summary Bar ──────────────────────────────── */}
      <div className="fleet-summary">
        <div className="fleet-summary-stat">
          <div className="fleet-summary-num">{ships.length}</div>
          <div className="fleet-summary-lbl">Vessels</div>
        </div>
        <div className="fleet-summary-stat">
          <div className="fleet-summary-num" style={{ color: '#3E9B72' }}>{availableCount}</div>
          <div className="fleet-summary-lbl">Available</div>
        </div>
        <div className="fleet-summary-stat">
          <div className="fleet-summary-num" style={{ color: 'var(--terracotta)' }}>{deployedCount}</div>
          <div className="fleet-summary-lbl">Deployed</div>
        </div>
        <div className="fleet-summary-stat">
          <div className="fleet-summary-num" style={{ color: 'var(--navy-deep)' }}>{totalRescued}</div>
          <div className="fleet-summary-lbl">Rescued</div>
        </div>
      </div>

      {/* ── Vessel Operations Cards ────────────────────────── */}
      <div className="sidebar-scroll-body">
        {ships.map((ship, idx) => {
          const color = VESSEL_COLORS[idx % 8];
          const route = plan?.routes.find(r => r.ship_id === ship.id);
          const simShip = simulatedShips.find(s => s.ship_id === ship.id);

          const isAssigned = plan && route && route.steps.some(s => s.action === 'RESCUE');

          // Live status during simulation
          let statusText = isAssigned ? 'DEPLOYED' : 'DOCKED';
          let badgeClass = isAssigned ? 'status-deployed' : 'status-docked';

          if (isSimulationActive && simShip) {
            statusText = simShip.statusText;
            if (simShip.status === 'ARRIVED') badgeClass = 'status-arrived';
            else if (simShip.status === 'MISSION_COMPLETE') badgeClass = 'status-complete';
            else if (simShip.status === 'DEPLOYED') badgeClass = 'status-deployed';
            else badgeClass = 'status-docked';
          }

          const currentRescued = isSimulationActive && simShip
            ? simShip.current_load
            : (route?.total_rescued ?? 0);

          const utilPct = ship.max_capacity > 0
            ? Math.round((currentRescued / ship.max_capacity) * 100)
            : 0;

          const distNm = route ? Number(route.total_distance_nm).toFixed(0) : '—';
          const timeHrs = route ? (route.total_time_minutes / 60).toFixed(1) : '—';
          const assignedIslands = route?.steps.filter(s => s.action === 'RESCUE').map(s => s.location_name) ?? [];

          return (
            <div key={ship.id} className="vessel-card" style={{ borderLeftColor: color }}>

              {/* Vessel Header */}
              <div className="vessel-card-header">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <div style={{ paddingTop: '2px' }}>
                    <Ship size={16} color={color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="vessel-name" style={{ color: 'var(--navy-deep)' }}>{ship.name}</div>
                    <div className="vessel-type">{ship.type}</div>
                  </div>
                </div>
                <span className={`status-badge ${badgeClass}`}>
                  {statusText}
                </span>
              </div>

              {/* Capacity Progress Bar */}
              {plan && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={11} /> <strong>{currentRescued}</strong> / {ship.max_capacity} on board
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: utilPct >= 95 ? 'var(--status-critical)' : utilPct >= 70 ? 'var(--status-high)' : 'var(--text-secondary)'
                    }}>
                      {utilPct}%
                    </span>
                  </div>
                  <div className="capacity-rail">
                    <div
                      className="capacity-fill"
                      style={{
                        width: `${Math.min(100, utilPct)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Vessel Spec Grid */}
              <div className="vessel-stats">
                <div className="vessel-stat" title="Vessel Speed">
                  <div className="vessel-stat-val">{ship.speed_knots} kt</div>
                  <div className="vessel-stat-lbl">Speed</div>
                </div>
                <div className="vessel-stat" title="Total Nautical Miles">
                  <div className="vessel-stat-val">{distNm}</div>
                  <div className="vessel-stat-lbl">Distance nm</div>
                </div>
                <div className="vessel-stat" title="Mission Duration">
                  <div className="vessel-stat-val">{timeHrs}h</div>
                  <div className="vessel-stat-lbl">ETA</div>
                </div>
              </div>

              {/* Route Assignment Tags */}
              {assignedIslands.length > 0 ? (
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Route size={10} /> Rescue Sequence
                  </div>
                  <div className="route-tags">
                    {assignedIslands.map((name, i) => (
                      <span key={i} className="route-tag">
                        {i + 1}. {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Anchor size={12} /> {plan ? 'Standby reserve vessel' : 'Docked at Port Royal'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
