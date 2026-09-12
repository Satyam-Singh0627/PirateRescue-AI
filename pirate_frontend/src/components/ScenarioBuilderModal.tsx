import React, { useState } from 'react';
import { X, Sparkles, Save } from 'lucide-react';
import { Scenario } from '../types';

interface ScenarioBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveScenario: (newScenario: any) => Promise<void>;
}

export const ScenarioBuilderModal: React.FC<ScenarioBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveScenario,
}) => {
  const [name, setName] = useState('Custom Gale: Cayman Trench');
  const [islandCount, setIslandCount] = useState(6);
  const [shipCount, setShipCount] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsSaving(true);
    try {
      const baseLat = 17.936;
      const baseLon = -76.841;

      const islandNames = [
        'Smuggler Cay', 'Devil Point', 'Gallows Reef', 'Siren Shoals',
        'Buccaneer Bay', 'Black Pearl Cove', 'Kraken Trench', 'Voodoo Key',
        'Cutlass Isle', 'Maroon Lagoon', 'Cannon Rock', 'Treasure Atoll'
      ];

      const medicalOptions = ['Clean Water', 'Plasma', 'Splints', 'Antibiotics', 'Rations', 'Burn Ointment'];

      const generatedIslands = Array.from({ length: islandCount }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distDeg = 0.8 + Math.random() * 4.5;
        const lat = baseLat + Math.sin(angle) * (distDeg * 0.75);
        const lon = baseLon + Math.cos(angle) * distDeg;
        const pop = Math.floor(Math.random() * 280) + 70;
        const urgencyScore = Math.floor(Math.random() * 65) + 35;

        let urgencyLevel = 'MEDIUM';
        if (urgencyScore >= 85) urgencyLevel = 'CRITICAL';
        else if (urgencyScore >= 65) urgencyLevel = 'HIGH';
        else if (urgencyScore <= 40) urgencyLevel = 'LOW';

        return {
          id: `custom_isl_${Date.now()}_${i + 1}`,
          name: islandNames[i % islandNames.length] + ` ${i + 1}`,
          latitude: parseFloat(lat.toFixed(3)),
          longitude: parseFloat(lon.toFixed(3)),
          population: pop,
          children_count: Math.floor(pop * 0.22),
          elderly_count: Math.floor(pop * 0.16),
          injured_count: Math.floor(pop * 0.12),
          urgency_level: urgencyLevel,
          urgency_score: urgencyScore,
          medical_needs: [
            medicalOptions[Math.floor(Math.random() * medicalOptions.length)],
            medicalOptions[Math.floor(Math.random() * medicalOptions.length)],
          ],
          hazard_level: parseFloat((1.0 + Math.random() * 1.5).toFixed(1)),
        };
      });

      const shipClasses = [
        { name: 'Sea Serpent', type: 'Fast Cutter', cap: 240, spd: 32 },
        { name: 'Iron Corsair', type: 'Medium Frigate', cap: 460, spd: 26 },
        { name: 'Neptune Leviathan', type: 'Heavy Transport', cap: 750, spd: 21 },
        { name: 'Wind Dancer', type: 'Fast Sloop', cap: 180, spd: 35 },
      ];

      const generatedShips = Array.from({ length: shipCount }, (_, i) => {
        const t = shipClasses[i % shipClasses.length];
        return {
          id: `custom_ship_${Date.now()}_${i + 1}`,
          name: `${t.name} ${i + 1}`,
          type: t.type,
          latitude: baseLat,
          longitude: baseLon,
          max_capacity: t.cap,
          current_load: 0,
          speed_knots: t.spd,
          fuel_capacity: 1500,
          current_fuel: 1500,
          status: 'DOCKED',
        };
      });

      const totalPop = generatedIslands.reduce((a, b) => a + b.population, 0);
      const totalCap = generatedShips.reduce((a, b) => a + b.max_capacity, 0);

      const payload: Partial<Scenario> = {
        id: `custom_${Date.now()}`,
        name,
        difficulty: 'Custom',
        description: `Custom generated Caribbean disaster scenario: ${islandCount} islands, ${shipCount} rescue vessels.`,
        islands_count: islandCount,
        ships_count: shipCount,
        total_population: totalPop,
        total_fleet_capacity: totalCap,
        islands: generatedIslands as any,
        ships: generatedShips as any,
      };

      await onSaveScenario(payload);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#F1D48A" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#EBD6A7', fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', textShadow: '0 2px 4px rgba(0,0,0,0.8)', margin: 0 }}>
              Custom Disaster Scenario Generator
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#382110', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scenario Codename
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid var(--border-default)',
                padding: '8px 12px',
                borderRadius: '6px',
                color: 'var(--navy-deep)',
                fontSize: '13.5px',
                fontWeight: 500,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--navy-deep)', marginBottom: '5px' }}>
                Stranded Islands: <strong>{islandCount}</strong>
              </label>
              <input
                type="range"
                min="3"
                max="25"
                value={islandCount}
                onChange={(e) => setIslandCount(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--terracotta)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--navy-deep)', marginBottom: '5px' }}>
                Rescue Vessels: <strong>{shipCount}</strong>
              </label>
              <input
                type="range"
                min="2"
                max="8"
                value={shipCount}
                onChange={(e) => setShipCount(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--terracotta)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.6rem' }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleGenerate} disabled={isSaving}>
              <Save size={14} />
              {isSaving ? 'Generating…' : 'Generate & Load Scenario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
