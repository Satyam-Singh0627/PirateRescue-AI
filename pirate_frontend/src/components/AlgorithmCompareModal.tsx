import React from 'react';
import { X, Award, Zap, Dna, Compass } from 'lucide-react';
import { AlgorithmBenchmark } from '../types';

interface AlgorithmCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  benchmarks: {
    greedy?: AlgorithmBenchmark;
    genetic?: AlgorithmBenchmark;
    hybrid?: AlgorithmBenchmark;
  } | null;
  isLoading: boolean;
  onRunComparison: () => void;
}

export const AlgorithmCompareModal: React.FC<AlgorithmCompareModalProps> = ({
  isOpen,
  onClose,
  benchmarks,
  isLoading,
  onRunComparison,
}) => {
  if (!isOpen) return null;

  const greedy = benchmarks?.greedy;
  const genetic = benchmarks?.genetic;
  const hybrid = benchmarks?.hybrid;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#F1D48A" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#EBD6A7', fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', textShadow: '0 2px 4px rgba(0,0,0,0.8)', margin: 0 }}>
              Optimization Algorithm Benchmark
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '13px', color: '#3E2412', fontWeight: 600, fontFamily: "'IM Fell English', Georgia, serif", margin: 0 }}>
              Rigorous side-by-side performance comparison on the active maritime scenario.
            </p>
            <button className="btn-primary" onClick={onRunComparison} disabled={isLoading}>
              {isLoading ? 'Benchmarking…' : '⚡ Re-run Benchmark'}
            </button>
          </div>

          {benchmarks ? (
            <div>
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Compute Time</th>
                    <th>Lives Saved</th>
                    <th>Rescue Rate</th>
                    <th>Fleet Distance</th>
                    <th>Mission Time</th>
                    <th>Fitness Index</th>
                  </tr>
                </thead>
                <tbody>
                  {greedy && (
                    <tr>
                      <td style={{ fontWeight: 700, color: '#8C2314', fontFamily: "'Cinzel', serif" }}>
                        <Zap size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#8C2314' }} /> Greedy (Urgent First)
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#24140A' }}>{greedy.computation_time_ms.toFixed(1)} ms</td>
                      <td style={{ color: '#24140A' }}>{greedy.lives_saved} souls</td>
                      <td style={{ color: '#24140A' }}>{greedy.rescue_rate}%</td>
                      <td style={{ color: '#24140A' }}>{greedy.total_distance_nm.toFixed(0)} nm</td>
                      <td style={{ color: '#24140A' }}>{(greedy.total_time_mins / 60).toFixed(1)} hrs</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#24140A' }}>{greedy.fitness_score.toFixed(1)}</td>
                    </tr>
                  )}

                  {genetic && (
                    <tr>
                      <td style={{ fontWeight: 700, color: '#1B5E6B', fontFamily: "'Cinzel', serif" }}>
                        <Dna size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#1B5E6B' }} /> Genetic Metaheuristic
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#24140A' }}>{genetic.computation_time_ms.toFixed(1)} ms</td>
                      <td style={{ color: '#24140A' }}>{genetic.lives_saved} souls</td>
                      <td style={{ color: '#24140A' }}>{genetic.rescue_rate}%</td>
                      <td style={{ color: '#24140A' }}>{genetic.total_distance_nm.toFixed(0)} nm</td>
                      <td style={{ color: '#24140A' }}>{(genetic.total_time_mins / 60).toFixed(1)} hrs</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#24140A' }}>{genetic.fitness_score.toFixed(1)}</td>
                    </tr>
                  )}

                  {hybrid && (
                    <tr style={{ background: 'rgba(62, 155, 114, 0.12)' }}>
                      <td style={{ fontWeight: 800, color: '#1A4D2E', fontFamily: "'Cinzel', serif" }}>
                        <Compass size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#8C2314' }} /> Hybrid (Greedy + GA)
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#140A05' }}>{hybrid.computation_time_ms.toFixed(1)} ms</td>
                      <td style={{ fontWeight: 700, color: '#1E6F43' }}>{hybrid.lives_saved} souls</td>
                      <td style={{ fontWeight: 700, color: '#1E6F43' }}>{hybrid.rescue_rate}%</td>
                      <td style={{ fontWeight: 700, color: '#140A05' }}>{hybrid.total_distance_nm.toFixed(0)} nm</td>
                      <td style={{ fontWeight: 700, color: '#140A05' }}>{(hybrid.total_time_mins / 60).toFixed(1)} hrs</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#8C2314' }}>{hybrid.fitness_score.toFixed(1)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Trade-off Insights */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.2rem',
                  background: 'linear-gradient(180deg, #2A170C 0%, #1A0E07 100%)',
                  borderRadius: '8px',
                  border: '1.5px solid #6E4522',
                  borderLeft: '4.5px solid #C59A45',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#EBD6A7',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ color: '#F5E5C9', fontFamily: "'Cinzel', serif", fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Maritime Fleet Dispatch Insights:
                </div>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>
                    <strong style={{ color: '#F1D48A' }}>Greedy Heuristic</strong> generates immediate routing decisions (&lt; 20ms) prioritizing the highest urgency islands first.
                  </li>
                  <li>
                    <strong style={{ color: '#F1D48A' }}>Genetic Algorithm</strong> evaluates multi-vessel capacity combinations across the entire Caribbean sea basin.
                  </li>
                  <li>
                    <strong style={{ color: '#F1D48A' }}>Hybrid Solver</strong> seeds the population with the greedy heuristic and optimizes routes to maximize souls rescued while minimizing fuel and time.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#4A2E16', fontWeight: 600 }}>
              Click "Re-run Benchmark" to evaluate all 3 algorithms side-by-side.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
