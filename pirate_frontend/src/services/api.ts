import { Scenario, BasePort, RescuePlan, AlgorithmBenchmark } from '../types';

const API_BASE = '/api';

export const api = {
  async getScenarios(): Promise<Scenario[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  async getScenario(id: string): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch scenario: ${id}`);
    return res.json();
  },

  async getBasePort(): Promise<BasePort> {
    const res = await fetch(`${API_BASE}/scenarios/base/port`);
    if (!res.ok) throw new Error('Failed to fetch base port');
    return res.json();
  },

  async solve(payload: {
    scenario_id?: string;
    islands: any[];
    ships: any[];
    base_position: [number, number];
    algorithm: string;
    time_limit_seconds?: number;
    generations?: number;
    population_size?: number;
  }): Promise<{ plan: RescuePlan; success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Optimization error' }));
      throw new Error(err.detail || 'Solver failed');
    }
    return res.json();
  },

  async compare(payload: {
    scenario_id?: string;
    islands: any[];
    ships: any[];
    base_position: [number, number];
  }): Promise<{
    scenario_id: string;
    comparison: {
      greedy: AlgorithmBenchmark;
      genetic: AlgorithmBenchmark;
      hybrid: AlgorithmBenchmark;
    };
  }> {
    const res = await fetch(`${API_BASE}/solve/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Comparison failed');
    return res.json();
  },

  async createCustomScenario(scenario: any): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    });
    if (!res.ok) throw new Error('Failed to create scenario');
    return res.json();
  },
};
