import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, Zap, ShieldAlert, Award } from 'lucide-react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { FleetStatus } from './components/FleetStatus';
import { IslandTriage } from './components/IslandTriage';
import { ReplayControls } from './components/ReplayControls';
import { AlgorithmCompareModal } from './components/AlgorithmCompareModal';
import { ScenarioBuilderModal } from './components/ScenarioBuilderModal';
import { LandingPage } from './components/LandingPage/LandingPage';
import { api } from './services/api';
import { soundService } from './services/soundService';
import { Scenario, BasePort, RescuePlan, Island, RescueShip, AlgorithmBenchmark } from './types';
import { buildDetailedRoutePath, interpolateShipPosition, DetailedRoutePath, SimulatedShipState } from './utils/geoRouting';

import './styles/pirate-theme.css';
import './styles/dashboard.css';
import './styles/animations.css';

export const App: React.FC = () => {
  // Navigation view: 'landing' vs 'operations'
  const [currentView, setCurrentView] = useState<'landing' | 'operations'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('operations') || hash.includes('platform')) {
        return 'operations';
      }
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('operations') || hash.includes('platform')) {
        setCurrentView('operations');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Scenarios state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('gale_of_tortuga');
  const [basePort, setBasePort] = useState<BasePort | null>(null);

  // Active scenario entities
  const [islands, setIslands] = useState<Island[]>([]);
  const [ships, setShips] = useState<RescueShip[]>([]);

  // Optimization state
  const [algorithm, setAlgorithm] = useState<'greedy' | 'genetic' | 'hybrid'>('hybrid');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [plan, setPlan] = useState<RescuePlan | null>(null);

  // Emergency distress state
  const [emergencyIsland, setEmergencyIsland] = useState<Island | null>(null);

  // Simulation Replay state
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [simMinutes, setSimMinutes] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Modals state
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [benchmarks, setBenchmarks] = useState<{
    greedy?: AlgorithmBenchmark;
    genetic?: AlgorithmBenchmark;
    hybrid?: AlgorithmBenchmark;
  } | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 1. Initial Load of Scenarios and Base Port
  useEffect(() => {
    async function init() {
      try {
        const [scList, bp] = await Promise.all([
          api.getScenarios(),
          api.getBasePort(),
        ]);
        setScenarios(scList);
        setBasePort(bp);

        const target = scList.find((s) => s.id === 'gale_of_tortuga') || scList[0];
        if (target) {
          setSelectedScenarioId(target.id);
          setIslands(target.islands);
          setShips(target.ships);
        }
      } catch (err) {
        console.error('Failed to initialize coordinator:', err);
      }
    }
    init();
  }, []);

  // 2. Switch Active Scenario
  const handleSelectScenario = useCallback(
    (scId: string) => {
      setSelectedScenarioId(scId);
      const sc = scenarios.find((s) => s.id === scId);
      if (sc) {
        setIslands(sc.islands);
        setShips(sc.ships);
        setPlan(null);
        setEmergencyIsland(null);
        setIsPlaying(false);
        setIsReplayActive(false);
        setSimMinutes(0);
      }
    },
    [scenarios]
  );

  // 3. Execute Optimization
  const handleOptimize = useCallback(async () => {
    if (!islands.length || !ships.length) return;
    setIsOptimizing(true);
    setIsPlaying(false);
    setSimMinutes(0);

    try {
      const basePos: [number, number] = basePort
        ? [basePort.latitude, basePort.longitude]
        : [17.936, -76.841];

      const res = await api.solve({
        scenario_id: selectedScenarioId,
        islands,
        ships,
        base_position: basePos,
        algorithm,
      });

      setPlan(res.plan);
      setIsReplayActive(true);
      setIsPlaying(true);
      soundService.playVictory();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#DFA58F', '#B96F5B', '#B8954A', '#3D8190'],
      });
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  }, [islands, ships, basePort, selectedScenarioId, algorithm]);

  // 4. Trigger Emergency Distress Signal
  const handleTriggerEmergency = useCallback(() => {
    soundService.playDistress();
    const newEmergency: Island = {
      id: `stormwatch_isl_${Date.now()}`,
      name: 'Stormwatch Island',
      latitude: 19.45,
      longitude: -74.85,
      population: 35,
      children_count: 14,
      elderly_count: 8,
      injured_count: 13,
      urgency_level: 'CRITICAL',
      urgency_score: 99,
      medical_needs: ['Emergency Trauma Kit', 'Plasma', 'Clean Water'],
      hazard_level: 2.5,
    };

    setEmergencyIsland(newEmergency);
    setIslands(prev => [newEmergency, ...prev]);
  }, []);

  // 5. Re-optimize Fleet after Emergency
  const handleReOptimize = useCallback(async () => {
    setEmergencyIsland(null);
    await handleOptimize();
  }, [handleOptimize]);

  // 6. Run Benchmarks
  const handleRunComparison = useCallback(async () => {
    if (!islands.length || !ships.length) return;
    setIsComparing(true);
    try {
      const basePos: [number, number] = basePort
        ? [basePort.latitude, basePort.longitude]
        : [17.936, -76.841];

      const res = await api.compare({
        scenario_id: selectedScenarioId,
        islands,
        ships,
        base_position: basePos,
      });
      setBenchmarks(res.comparison);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsComparing(false);
    }
  }, [islands, ships, basePort, selectedScenarioId]);

  // 7. Save Custom Scenario
  const handleSaveCustomScenario = useCallback(
    async (newScenario: any) => {
      try {
        const created = await api.createCustomScenario(newScenario);
        setScenarios((prev) => [...prev, created]);
        setSelectedScenarioId(created.id);
        setIslands(created.islands);
        setShips(created.ships);
        setPlan(null);
        setEmergencyIsland(null);
        soundService.playShipBell();
      } catch (e) {
        console.error('Failed to create custom scenario:', e);
      }
    },
    []
  );

  // 8. Canonical Detailed Route Paths (SHARED SOURCE OF TRUTH)
  const detailedRoutePaths = useMemo<DetailedRoutePath[]>(() => {
    if (!plan?.routes) return [];
    return plan.routes.map(r => buildDetailedRoutePath(r));
  }, [plan]);

  // 9. Continuous Ship Movement & Interpolation
  const simulatedShips = useMemo<SimulatedShipState[]>(() => {
    if (!plan || !isReplayActive) return [];
    return detailedRoutePaths.map((detailedPath) => {
      const route = plan.routes.find(r => r.ship_id === detailedPath.ship_id);
      return interpolateShipPosition(detailedPath, route, simMinutes);
    });
  }, [plan, isReplayActive, detailedRoutePaths, simMinutes]);

  // 10. Dynamically Rescued Islands during simulation
  const rescuedIslandIds = useMemo<string[]>(() => {
    if (!isReplayActive) {
      return plan ? plan.island_statuses.filter(s => s.rescued).map(s => s.island_id) : [];
    }
    const set = new Set<string>();
    simulatedShips.forEach(ss => {
      ss.visitedIslandIds.forEach(id => set.add(id));
    });
    return Array.from(set);
  }, [isReplayActive, plan, simulatedShips]);

  // 11. Dynamically Rescued Survivors count during simulation
  const liveRescuedCount = useMemo<number>(() => {
    if (!plan) return 0;
    if (!isReplayActive) return plan.total_lives_saved;
    return islands
      .filter(isl => rescuedIslandIds.includes(isl.id))
      .reduce((sum, isl) => sum + isl.population, 0);
  }, [plan, isReplayActive, islands, rescuedIslandIds]);

  // 12. Simulation Replay Loop
  useEffect(() => {
    if (!isPlaying || !plan) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
      return;
    }

    const totalDuration = plan.total_mission_time_minutes;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000.0;
        // At 1x speed, 1 real second = 12 simulated minutes
        const advancedMinutes = deltaSec * 12.0 * replaySpeed;

        setSimMinutes((prev) => {
          const next = prev + advancedMinutes;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, plan, replaySpeed]);

  // Dashboard Aggregates
  const totalStranded = islands.reduce((s, i) => s + i.population, 0);
  const livesSaved = liveRescuedCount;
  const remaining = Math.max(0, totalStranded - livesSaved);
  const criticalCount = islands.filter(i =>
    (i.urgency_level || '').toUpperCase() === 'CRITICAL' && !rescuedIslandIds.includes(i.id)
  ).length;

  const deployedCount = plan
    ? ships.filter(sh => plan.routes.find(r => r.ship_id === sh.id && r.steps.some(s => s.action === 'RESCUE'))).length
    : 0;

  const availableVessels = ships.length - deployedCount;
  const coveragePercent = totalStranded > 0 ? Math.round((livesSaved / totalStranded) * 100) : 0;

  // Navigation Handlers
  const handleLaunchPlatform = useCallback(() => {
    setCurrentView('operations');
    if (typeof window !== 'undefined') {
      window.location.hash = '#operations';
    }
    soundService.playShipBell();
  }, []);

  const handleNavigateLanding = useCallback(() => {
    setCurrentView('landing');
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
    soundService.playClick();
  }, []);

  if (currentView === 'landing') {
    return <LandingPage onLaunchPlatform={handleLaunchPlatform} />;
  }

  return (
    <div className="app-container">

      {/* ── TOP HEADER DECK ──────────────────────────────────── */}
      <Header
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        algorithm={algorithm}
        onChangeAlgorithm={setAlgorithm}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        onToggleReplay={() => {
          if (!plan) {
            handleOptimize();
            return;
          }
          if (isReplayActive && isPlaying) {
            setIsPlaying(false);
          } else {
            setIsReplayActive(true);
            setIsPlaying(true);
          }
        }}
        isReplayActive={isReplayActive}
        onOpenCompare={() => { setIsCompareOpen(true); if (!benchmarks) handleRunComparison(); }}
        onOpenCustomScenario={() => setIsCustomOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => { setIsMuted(soundService.toggleMute()); }}
        onNavigateLanding={handleNavigateLanding}
      />

      {/* ── KPI METRICS BAR ──────────────────────────────────── */}
      <div className="stats-bar">
        <div className="stat-pill">
          <div className="stat-pill-icon">Total Survivors</div>
          <div className="stat-pill-value">{totalStranded.toLocaleString()}</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon" style={{ color: 'var(--status-low)' }}>Rescued</div>
          <div className="stat-pill-value" style={{ color: livesSaved > 0 ? 'var(--status-low)' : 'var(--navy-deep)' }}>
            {livesSaved.toLocaleString()}
          </div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon">Remaining</div>
          <div className="stat-pill-value" style={{ color: remaining > 0 ? 'var(--navy-deep)' : 'var(--status-low)' }}>
            {remaining.toLocaleString()}
          </div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon" style={{ color: criticalCount > 0 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
            Critical Islands
          </div>
          <div className="stat-pill-value" style={{ color: criticalCount > 0 ? 'var(--status-critical)' : 'var(--navy-deep)' }}>
            {criticalCount}
          </div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon" style={{ color: 'var(--terracotta)' }}>Available Vessels</div>
          <div className="stat-pill-value" style={{ color: 'var(--terracotta)' }}>
            {availableVessels} / {ships.length}
          </div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon">Active Missions</div>
          <div className="stat-pill-value" style={{ color: deployedCount > 0 ? 'var(--color-route)' : 'var(--navy-deep)' }}>
            {deployedCount}
          </div>
        </div>
        {plan && (
          <div className="stat-pill">
            <div className="stat-pill-icon">Coverage</div>
            <div className="stat-pill-value" style={{ color: coveragePercent >= 80 ? 'var(--status-low)' : 'var(--navy-deep)' }}>
              {coveragePercent}%
            </div>
          </div>
        )}
      </div>

      {/* ── 3-COLUMN WORKSPACE (CENTER MAP IS THE HERO) ───────── */}
      <main className="three-col-workspace">

        {/* LEFT PANEL — Rescue Priority Queue */}
        <aside className="left-panel">
          <div className="panel-header">
            <span>Rescue Priority</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                style={{ padding: '2px 7px', fontSize: '10px', color: 'var(--status-critical)', borderColor: 'rgba(201,76,76,0.3)' }}
                onClick={handleTriggerEmergency}
                title="Trigger emergency distress signal test"
              >
                + Distress
              </button>
              {criticalCount > 0 && (
                <span className="badge badge-critical">
                  {criticalCount} Critical
                </span>
              )}
            </div>
          </div>

          {/* Emergency Banner */}
          {emergencyIsland && (
            <div style={{
              margin: '8px 10px',
              padding: '10px 12px',
              background: '#FFF5F5',
              border: '1px solid #F5C6CB',
              borderLeft: '4px solid var(--status-critical)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--status-critical)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> New Distress Signal
                </span>
                <span className="badge badge-critical">CRITICAL</span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-deep)' }}>
                {emergencyIsland.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <strong>{emergencyIsland.population}</strong> survivors · <strong>{emergencyIsland.injured_count}</strong> critical trauma cases
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--status-critical)', borderColor: '#A83232' }}
                  onClick={handleReOptimize}
                >
                  Re-Optimize Fleet
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setEmergencyIsland(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <IslandTriage
            islands={islands}
            plan={plan}
            rescuedIslandIds={rescuedIslandIds}
          />
        </aside>

        {/* CENTER PANEL — High-Importance Map (Clean, No Giant Overlay) */}
        <section className="center-panel">
          <MapView
            basePort={basePort}
            islands={islands}
            ships={ships}
            plan={plan}
            simulatedShips={simulatedShips}
            isSimulationActive={isReplayActive}
            detailedRoutePaths={detailedRoutePaths}
            rescuedIslandIds={rescuedIslandIds}
          />

          {/* Compact Floating Replay Dock at Bottom */}
          {isReplayActive && plan && (
            <ReplayControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(p => !p)}
              progressPercent={
                plan.total_mission_time_minutes > 0
                  ? (simMinutes / plan.total_mission_time_minutes) * 100
                  : 0
              }
              onSeek={(pct) => setSimMinutes((pct / 100) * plan.total_mission_time_minutes)}
              speed={replaySpeed}
              onChangeSpeed={setReplaySpeed}
              onReset={() => { setIsPlaying(false); setSimMinutes(0); }}
              elapsedMinutes={simMinutes}
              totalMinutes={plan.total_mission_time_minutes}
            />
          )}
        </section>

        {/* RIGHT PANEL — Fleet Operations + Decision Rationale */}
        <aside className="right-panel">
          <div className="panel-header">
            <span>Fleet Operations</span>
            {plan && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--status-low)', fontWeight: 600 }}>
                {coveragePercent}% Rescued
              </span>
            )}
          </div>

          <FleetStatus
            ships={ships}
            plan={plan}
            simulatedShips={simulatedShips}
            isSimulationActive={isReplayActive}
          />

          {/* Decision Rationale */}
          {plan && (
            <div className="rationale-panel">
              <div className="rationale-title">Decision Rationale</div>

              {[
                { n: 1, txt: `Scored ${islands.length} islands by urgency triage (Critical → Low)` },
                { n: 2, txt: 'Matched each island to best-available vessel by speed & capacity' },
                { n: 3, txt: `Optimized route sequence using ${algorithm.toUpperCase()} solver` },
                { n: 4, txt: 'Computed continuous sea-safe paths avoiding Caribbean landmasses' },
                { n: 5, txt: `Plan total: ${plan.total_lives_saved} souls rescued · ${(plan.total_mission_time_minutes / 60).toFixed(1)} hrs · ${Number(plan.total_fleet_distance_nm).toFixed(0)} nm` },
              ].map(step => (
                <div key={step.n} className="rationale-step">
                  <div className="rationale-num">{step.n}</div>
                  <div className="rationale-text">{step.txt}</div>
                </div>
              ))}

              {/* Assignments summary */}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="rationale-title" style={{ marginBottom: '5px' }}>Optimized Deployments</div>
                {plan.routes.filter(r => r.steps.some(s => s.action === 'RESCUE')).map(r => {
                  const rescueCount = r.steps.filter(s => s.action === 'RESCUE').length;
                  const firstDest = r.steps.find(s => s.action === 'RESCUE');
                  return (
                    <div key={r.ship_id} className="assignment-row">
                      <span className="assignment-ship">{r.ship_name.split(' ').pop()}</span>
                      <span className="assignment-arrow">→</span>
                      <span className="assignment-dest">
                        {rescueCount > 1 ? `${rescueCount} islands` : firstDest?.location_name}
                      </span>
                      <span className="assignment-eta">{r.total_rescued} souls</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* Modals */}
      <AlgorithmCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        benchmarks={benchmarks}
        isLoading={isComparing}
        onRunComparison={handleRunComparison}
      />
      <ScenarioBuilderModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        onSaveScenario={handleSaveCustomScenario}
      />
    </div>
  );
};

export default App;
