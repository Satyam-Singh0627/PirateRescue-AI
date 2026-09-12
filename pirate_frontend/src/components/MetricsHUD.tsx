import React from 'react';
import { RescuePlan } from '../types';

interface MetricsHUDProps {
  plan: RescuePlan | null;
  totalPopulation: number;
}

interface HudCardProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  subtext: string;
  color: string;
  title: string; // tooltip explanation
}

const HudCard: React.FC<HudCardProps> = ({ icon, label, value, unit, subtext, color, title }) => (
  <div
    title={title}
    style={{
      background: 'rgba(8,13,22,0.93)',
      backdropFilter: 'blur(14px)',
      border: `1px solid ${color}44`,
      borderTop: `2px solid ${color}`,
      borderRadius: '8px',
      padding: '8px 14px',
      minWidth: '120px',
      flex: '1 1 0',
      boxShadow: `0 2px 10px rgba(0,0,0,0.5), 0 0 8px ${color}11`,
      cursor: 'default',
    }}
  >
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6rem',
      color: '#64748b',
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '4px',
    }}>
      {icon} {label}
    </div>
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: '1.35rem',
      fontWeight: 900,
      color,
      lineHeight: 1,
      textShadow: `0 0 12px ${color}55`,
      marginBottom: '3px',
    }}>
      {value}
      {unit && (
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', marginLeft: '4px' }}>
          {unit}
        </span>
      )}
    </div>
    <div style={{
      fontSize: '0.62rem',
      color: '#64748b',
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {subtext}
    </div>
  </div>
);

export const MetricsHUD: React.FC<MetricsHUDProps> = ({ plan, totalPopulation }) => {
  const livesSaved  = plan?.total_lives_saved ?? 0;
  const rescueRate  = plan?.rescue_rate_percent ?? 0;
  const missionHrs  = plan ? (plan.total_mission_time_minutes / 60).toFixed(1) : '—';
  const totalDist   = plan ? plan.total_fleet_distance_nm.toFixed(0) : '—';
  const fitness     = plan ? plan.fitness_score.toFixed(1) : '—';
  const computeMs   = plan ? `${plan.computation_time_ms.toFixed(0)} ms` : '—';

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      width: '100%',
    }}>
      <HudCard
        icon="👥"
        label="Lives Saved"
        value={plan ? livesSaved.toLocaleString() : '—'}
        subtext={plan
          ? `${rescueRate}% of ${totalPopulation.toLocaleString()} population`
          : 'Click Deploy Fleet to optimize'}
        color="#00f5d4"
        title="Total number of survivors rescued across all islands"
      />
      <HudCard
        icon="⏱️"
        label="Mission Time"
        value={missionHrs}
        unit="hrs"
        subtext={plan ? `${plan.total_mission_time_minutes.toFixed(0)} mins (longest route)` : 'Time until last ship returns'}
        color="#f4d03f"
        title="Total mission duration — time until all ships return to base"
      />
      <HudCard
        icon="🧭"
        label="Fleet Distance"
        value={totalDist}
        unit="NM"
        subtext="Nautical miles sailed (great-circle)"
        color="#9d4edd"
        title="Combined distance sailed by all rescue ships (haversine formula)"
      />
      <HudCard
        icon="📊"
        label="Fitness Score"
        value={fitness}
        subtext={plan ? `Computed in ${computeMs}` : 'Higher = better plan quality'}
        color="#ffa94d"
        title="Algorithm fitness: weighted score of lives saved (60%), speed (25%), and distance (15%). Higher is better."
      />
    </div>
  );
};
