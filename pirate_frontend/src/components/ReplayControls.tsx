import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { soundService } from '../services/soundService';

interface ReplayControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  progressPercent: number;
  onSeek: (percent: number) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  onReset: () => void;
  elapsedMinutes: number;
  totalMinutes: number;
}

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

const SPEEDS = [0.5, 1, 2, 5];

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  onTogglePlay,
  progressPercent,
  onSeek,
  speed,
  onChangeSpeed,
  onReset,
  elapsedMinutes,
  totalMinutes,
}) => {
  const isComplete = elapsedMinutes >= totalMinutes && totalMinutes > 0;

  return (
    <div className="replay-dock">
      {/* Mission status label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isComplete ? (
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-low)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-low)', display: 'inline-block' }} />
              Mission Complete
            </span>
          ) : isPlaying ? (
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--terracotta)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--terracotta)', display: 'inline-block' }} />
              Rescue Mission Active
            </span>
          ) : (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
              Rescue Simulation
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--navy-deep)' }}>
          {fmtTime(elapsedMinutes)} / {fmtTime(totalMinutes)}
        </span>
      </div>

      {/* Timeline */}
      <div className="replay-timeline">
        <input
          type="range"
          min={0}
          max={100}
          step={0.25}
          value={Math.min(100, Math.max(0, progressPercent))}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="replay-slider"
          aria-label="Simulation timeline"
          style={{ accentColor: 'var(--terracotta)' }}
        />
      </div>

      {/* Controls */}
      <div className="replay-actions">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={() => {
              soundService.playClick();
              onTogglePlay();
            }}
          >
            {isPlaying ? (
              <>
                <Pause size={13} /> Pause
              </>
            ) : (
              <>
                <Play size={13} /> {isComplete ? 'Replay' : 'Play'}
              </>
            )}
          </button>

          <button
            className="btn-icon"
            onClick={() => {
              soundService.playClick();
              onReset();
            }}
            title="Reset to departure"
            aria-label="Reset simulation"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginRight: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Speed
          </span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => {
                soundService.playClick();
                onChangeSpeed(s);
              }}
              style={{
                background: speed === s ? 'var(--navy-deep)' : '#FFFFFF',
                color: speed === s ? '#FFFFFF' : 'var(--navy-deep)',
                border: `1px solid ${speed === s ? 'var(--navy-deep)' : 'var(--border-default)'}`,
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s ease',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
