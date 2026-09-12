import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Users, Heart } from 'lucide-react';
import { Island, RescuePlan } from '../types';

interface IslandTriageProps {
  islands: Island[];
  plan: RescuePlan | null;
  rescuedIslandIds?: string[];
}

type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const URGENCY: Record<Urgency, { borderColor: string; badgeClass: string; dotColor: string }> = {
  CRITICAL: { borderColor: 'var(--status-critical)', badgeClass: 'badge-critical', dotColor: '#C94C4C' },
  HIGH:     { borderColor: 'var(--status-high)',     badgeClass: 'badge-high',     dotColor: '#D9824B' },
  MEDIUM:   { borderColor: 'var(--status-medium)',   badgeClass: 'badge-medium',   dotColor: '#C7A33A' },
  LOW:      { borderColor: 'var(--status-low)',      badgeClass: 'badge-low',      dotColor: '#3E9B72' },
};

export const IslandTriage: React.FC<IslandTriageProps> = ({ islands, plan, rescuedIslandIds = [] }) => {
  const sorted = [...islands].sort((a, b) => b.urgency_score - a.urgency_score);

  return (
    <div className="sidebar-scroll-body">
      {sorted.map(island => {
        const urgency = (island.urgency_level || 'LOW').toUpperCase() as Urgency;
        const urg = URGENCY[urgency] ?? URGENCY.LOW;
        const status = plan?.island_statuses.find(s => s.island_id === island.id);
        const isRescued = rescuedIslandIds.includes(island.id) || (status?.rescued ?? false);
        const ship = plan?.routes.find(r => r.ship_id === status?.assigned_ship_id);
        const etaHrs = status?.rescue_time_minutes ? (status.rescue_time_minutes / 60).toFixed(1) : null;
        const vulnCount = island.children_count + island.elderly_count + island.injured_count;
        const vulnPct = island.population > 0 ? (vulnCount / island.population) * 100 : 0;

        return (
          <div
            key={island.id}
            className={`island-card ${urgency.toLowerCase()} ${isRescued ? 'rescued' : ''}`}
          >
            {/* Name + priority badge */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'6px' }}>
              <div className="island-card-name">{island.name}</div>
              <span className={`badge ${urg.badgeClass}`}>{urgency}</span>
            </div>

            {/* Survivor count & vulnerable */}
            <div className="island-card-meta">
              <Users size={12} color="var(--text-muted)" />
              <span><strong style={{ color:'var(--navy-deep)' }}>{island.population}</strong> survivors</span>
              <span style={{ color:'var(--border-default)' }}>·</span>
              <Heart size={12} color="var(--text-muted)" />
              <span style={{ color: vulnPct > 40 ? 'var(--status-high)' : 'var(--text-secondary)' }}>
                {vulnCount} vulnerable
              </span>
            </div>

            {/* Vulnerability progress rail */}
            <div className="progress-bar-rail">
              <div style={{ display:'flex', height:'100%' }}>
                <div style={{ width:`${(island.children_count/island.population)*100}%`, background:'#4A6B82', flexShrink:0 }} title={`${island.children_count} children`} />
                <div style={{ width:`${(island.elderly_count/island.population)*100}%`,  background:'#D9824B', flexShrink:0 }} title={`${island.elderly_count} elderly`} />
                <div style={{ width:`${(island.injured_count/island.population)*100}%`,  background:'#C94C4C', flexShrink:0 }} title={`${island.injured_count} injured`} />
                <div style={{ flex:1, background:'#F0EAE3' }} />
              </div>
            </div>

            {/* Priority score & medical needs */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'11px', color:'var(--text-muted)' }}>
              <span style={{ fontFamily:'var(--font-mono)' }}>
                Priority Score: <strong style={{ color:'var(--navy-deep)' }}>{island.urgency_score.toFixed(0)}</strong>
              </span>
              {island.medical_needs?.length > 0 && (
                <span style={{ fontSize:'10px', color:'var(--text-secondary)' }}>
                  {island.medical_needs.join(', ')}
                </span>
              )}
            </div>

            {/* Rescue status */}
            <div style={{ paddingTop:'5px', borderTop:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'4px' }}>
              {isRescued ? (
                <span style={{ fontSize:'11.5px', color:'var(--status-low)', display:'flex', alignItems:'center', gap:'4px', fontWeight:600 }}>
                  <CheckCircle2 size={13} /> Rescued by {ship?.ship_name || 'Fleet'}
                </span>
              ) : (
                <span style={{ fontSize:'11.5px', color: plan ? 'var(--text-secondary)' : 'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px' }}>
                  <AlertTriangle size={13} color={plan ? 'var(--status-high)' : 'var(--text-muted)'} />
                  {plan ? 'Awaiting dispatch' : 'No plan generated'}
                </span>
              )}
              {etaHrs && !isRescued && (
                <span style={{ fontSize:'10.5px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', display:'flex', alignItems:'center', gap:'3px' }}>
                  <Clock size={11} /> ETA {etaHrs}h
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
