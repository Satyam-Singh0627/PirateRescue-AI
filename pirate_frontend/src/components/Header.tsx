import React from 'react';
import { Compass, Zap, Play, Volume2, VolumeX, BarChart3, PlusCircle } from 'lucide-react';
import { Scenario } from '../types';
import { soundService } from '../services/soundService';

interface HeaderProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  algorithm: 'greedy' | 'genetic' | 'hybrid';
  onChangeAlgorithm: (algo: 'greedy' | 'genetic' | 'hybrid') => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  onToggleReplay: () => void;
  isReplayActive: boolean;
  onOpenCompare: () => void;
  onOpenCustomScenario: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigateLanding?: () => void;
}

const ALGO_LABELS = {
  greedy:  { label: 'Greedy',  tip: 'Fast: urgency-first nearest-neighbor (<0.1s)' },
  genetic: { label: 'Genetic', tip: 'Evolutionary: multi-objective optimization (2–5s)' },
  hybrid:  { label: 'Hybrid',  tip: 'Recommended: Greedy seed + Genetic refinement' },
};

export const Header: React.FC<HeaderProps> = ({
  scenarios, selectedScenarioId, onSelectScenario,
  algorithm, onChangeAlgorithm,
  onOptimize, isOptimizing,
  onToggleReplay, isReplayActive,
  onOpenCompare, onOpenCustomScenario,
  isMuted, onToggleMute,
  onNavigateLanding,
}) => (
  <header className="header-deck">

    {/* ── Brand ──────────────────────────────────────────── */}
    <div
      className="brand-section"
      onClick={onNavigateLanding}
      style={{ cursor: onNavigateLanding ? 'pointer' : 'default' }}
      title={onNavigateLanding ? 'Return to 3D Landing Page & Project Overview' : undefined}
    >
      <Compass size={22} color="var(--gold)" />
      <div className="brand-title-group">
        <h1>PIRATE<span>RESCUE</span></h1>
        <p>Maritime Rescue Coordination</p>
      </div>
    </div>

    <div className="header-divider" />

    {/* ── System Operational Indicator ───────────────────── */}
    <div className="system-status">
      <span className="status-dot" />
      Operational
    </div>

    <div className="header-divider" />

    {/* ── Disaster Scenario Selector ─────────────────────── */}
    <div style={{ display:'flex', flexDirection:'column', gap:'1px', flexShrink:0 }}>
      <label style={{ fontSize:'9.5px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight: 600 }}>
        Scenario
      </label>
      <select
        className="scenario-select-box"
        value={selectedScenarioId}
        onChange={e => { soundService.playClick(); onSelectScenario(e.target.value); }}
        aria-label="Select disaster scenario"
      >
        {scenarios.map(sc => (
          <option key={sc.id} value={sc.id}>{sc.name}</option>
        ))}
      </select>
    </div>

    {/* ── Optimization Algorithm Segmented Control ────────── */}
    <div style={{ display:'flex', flexDirection:'column', gap:'1px', flexShrink:0 }}>
      <label style={{ fontSize:'9.5px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight: 600 }}>
        Optimization Engine
      </label>
      <div className="algo-switcher">
        {(['greedy', 'genetic', 'hybrid'] as const).map(key => (
          <button
            key={key}
            className={`algo-tab ${algorithm === key ? 'active' : ''}`}
            onClick={() => { soundService.playClick(); onChangeAlgorithm(key); }}
            title={ALGO_LABELS[key].tip}
          >
            {ALGO_LABELS[key].label}
          </button>
        ))}
      </div>
    </div>

    {/* Spacer */}
    <div style={{ flex: 1 }} />

    {/* ── Primary Action: GENERATE RESCUE PLAN ───────────── */}
    <button
      className="btn-primary"
      onClick={() => { soundService.playShipBell(); onOptimize(); }}
      disabled={isOptimizing}
      title="Generate the optimal rescue plan using the selected algorithm"
    >
      {isOptimizing
        ? <><span>⏳</span> Computing Route Matrix…</>
        : <><Zap size={14} /> Generate Rescue Plan</>
      }
    </button>

    {/* ── Secondary Actions ───────────────────────────────── */}
    <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
      <button
        className={`btn-secondary ${isReplayActive ? 'active-border' : ''}`}
        onClick={() => { soundService.playClick(); onToggleReplay(); }}
        title="Play the rescue mission step-by-step on the map"
      >
        <Play size={13} />
        {isReplayActive ? 'Stop Simulation' : 'Start Simulation'}
      </button>

      {onNavigateLanding && (
        <button
          className="btn-secondary"
          onClick={() => { soundService.playClick(); onNavigateLanding(); }}
          title="Return to 3D Landing Page & Project Overview"
        >
          Overview
        </button>
      )}

      <button
        className="btn-icon"
        onClick={() => { soundService.playClick(); onOpenCompare(); }}
        title="Benchmark all algorithms side-by-side"
        aria-label="Open algorithm comparison"
      >
        <BarChart3 size={16} />
      </button>

      <button
        className="btn-icon"
        onClick={() => { soundService.playClick(); onOpenCustomScenario(); }}
        title="Generate a custom disaster scenario"
        aria-label="Create custom scenario"
      >
        <PlusCircle size={16} />
      </button>

      <button
        className="btn-icon"
        onClick={onToggleMute}
        title={isMuted ? 'Unmute audio' : 'Mute audio'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  </header>
);
