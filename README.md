# PirateRescue AI

### Priority-Aware Disaster Fleet Optimization & Rescue Coordination

PirateRescue AI is a disaster-response coordination platform that helps optimize limited rescue vessels across multiple islands based on survivor urgency, vulnerability, vessel capacity, distance, ETA, and operational constraints.

---

## 🏆 Hackathon Achievement

**Team ByteForce — 3rd Place / 3rd Rank**

PirateRescue AI was developed by **Team ByteForce** as the solution for:

**PS #05 — Pirate Island Rescue**

---
## 🎬 Demo Video

Watch the complete PirateRescue AI demonstration:

**[▶️ Watch PirateRescue AI Demo Video](./Demovideo%20PirateRescue%20AI.mp4)**

The demo showcases the rescue coordination dashboard, island prioritization, fleet operations, optimization engine, vessel-to-island assignments, interactive map, rescue simulation, and dynamic re-optimization workflow.

---

## 🎯 Problem Statement

**PS #05 — Pirate Island Rescue**

> *"Formulate an algorithmic fleet disaster rescue coordinator that schedules rescue cutters to atolls with varying castaway populations, optimizing vessel capacities, distances, and survivor urgency."*

During a maritime or natural disaster, multiple islands require urgent evacuation simultaneously, while available rescue cutters, sloops, and transports are strictly limited in number, speed, and passenger capacity.

Each island has distinct characteristics:
- **Survivor Count**: Total stranded population requiring evacuation.
- **Vulnerability Breakdown**: Disproportionate fractions of children, elderly, and critically injured individuals.
- **Urgency Level**: Dynamic urgency ratings (Critical, High, Medium, Low) and hazard scores.
- **Critical Medical Demands**: Specific resource needs (surgical kits, clean water, blood plasma).
- **Geographic Coordinates**: Exact latitude/longitude across the Caribbean archipelago.

Each rescue vessel possesses physical constraints:
- **Passenger Capacity**: Maximum survivor payload.
- **Cruising Speed**: Knots under varying sea conditions.
- **Availability & Fuel**: Range limits and operational readiness.
- **Home Port / Staging Base**: Anchored at Port Royal, Jamaica (`17.936° N, 76.841° W`).

PirateRescue AI formulates this as a **Capacitated Multi-Vehicle Routing Problem with Priority Scheduling (CVRP-PS)** and solves it in real-time, delivering optimal vessel-to-island assignments and step-by-step navigational routes.

---

## ⚙️ How the System Works

The operational pipeline flows from raw island emergency telemetry to interactive fleet execution and dynamic re-optimization:

```text
Island & Survivor Data (Population, Demographics, Hazards)
        ↓
Vessel / Fleet Data (Capacities, Speeds, Port Locations)
        ↓
Priority Calculation (Urgency Score, Vulnerability Ratios)
        ↓
Distance & ETA Calculation (Great-Circle Haversine in Nautical Miles)
        ↓
Capacity & Availability Constraints (Load Balancing, Base Return)
        ↓
Optimization Engine (Greedy Heuristic / Genetic Algorithm / Hybrid Solver)
        ↓
Optimal Rescue Assignments & Leg Timetables
        ↓
Interactive Map & Route Polylines
        ↓
Real-Time Rescue Simulation (Telemetry via WebSocket)
        ↓
Emergency Detection & Dynamic Re-Optimization
```

---

## ✨ Features (Actually Implemented)

- **Standardized Disaster Scenario Catalog**: Pre-configured benchmark scenarios anchored in the Caribbean (`Tutorial: Calm Before the Storm`, `The Gale of Tortuga`, `The Kraken's Wake`, `The Armada Maelstrom`).
- **Priority-Aware Urgency Scoring**: Multi-factor ranking incorporating overall population, vulnerable fractions (children, elderly, injured), and island hazard multipliers.
- **Fleet Capacity & Availability Tracking**: Real-time validation preventing vessel over-allocation and ensuring strict adherence to passenger caps.
- **Nautical Distance & ETA Engine**: High-precision spherical trigonometry (Haversine formulation) computing nautical miles and cruising durations.
- **Triple Optimization Engine**:
  - **Greedy Heuristic Solver**: Instantaneous priority-first nearest-neighbor dispatch (< 50ms).
  - **Genetic Algorithm Solver**: Multi-objective evolutionary search exploring combinatorial assignment space.
  - **Hybrid Solver**: Uses the greedy plan as an elite Generation 0 seed for genetic improvement, guaranteeing monotonic quality.
- **Side-by-Side Algorithm Benchmark Modal**: Real-time comparative evaluation of Greedy vs. Genetic vs. Hybrid across compute time, lives saved, total distance, and Pareto fitness.
- **Interactive Leaflet Nautical Map**:
  - Custom dark nautical cartography with glowing urgency halos.
  - Directional ship markers with heading bearings.
  - Color-coded jewel-toned route polylines.
  - Base port marker at Port Royal.
- **Mission Simulation & Replay Controls**:
  - Real-time bidirectional WebSocket telemetry streaming (`/api/live/ws`).
  - Interactive playback bar with play/pause, timeline scrubbing, and speed multipliers (`0.5x`, `1x`, `2x`, `5x`).
- **Dynamic Scenario Forge**: In-app modal enabling dispatchers to create custom island and ship configurations on the fly.
- **Authentic Pirate Soundscapes**: Synthesized audio effects via browser Web Audio API (ship's bell, cannon fire, victory fanfare) with zero external media files.

---

## 🖥️ Dashboard Architecture

The dashboard is engineered for high-pressure crisis coordination:

```text
+----------------------------------------------------------------------------------------------------+
|  TOP BAR: Scenario Selector | Solver Picker (Greedy / Genetic / Hybrid) | Solve | Benchmark | HUD     |
+------------------------------------+----------------------------------+-----------------------------+
|  LEFT PANEL: ISLAND TRIAGE         |  CENTER PANEL: NAUTICAL MAP      |  RIGHT PANEL: FLEET STATUS  |
|                                    |                                  |                             |
|  - Island Name & Urgency Tag       |  - Port Royal Staging Base       |  - Vessel Name & Class      |
|  - Survivors & Vulnerable Ratio    |  - Stranded Island Halos         |  - Max Capacity vs Load     |
|  - Critical Medical Needs          |  - Directional Vessel Markers    |  - Speed (knots) & Fuel     |
|  - Rescue Status Badge             |  - Color-Coded Route Polylines   |  - Real-time Transit Status |
|  - Priority Score (0-100)          |  - Interactive Inspection Popups |  - Turn-by-Turn Leg Details |
+------------------------------------+----------------------------------+-----------------------------+
|  BOTTOM BAR: Mission Replay Controls (Play / Pause / Seek / Speed Multipliers: 0.5x - 5x)           |
+----------------------------------------------------------------------------------------------------+
```

---

## 🧠 Optimization Algorithms & Mathematical Formulation

### 1. Great-Circle Distance (Haversine Formula)
For coordinates $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ with Earth radius $R = 3440.065\text{ nm}$:
$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

### 2. Multi-Factor Island Urgency Score
$$\text{Priority} = \min\left(100, \left( \frac{\text{Pop}}{50} \times 20 + \frac{\text{Vulnerable}}{\text{Pop}} \times 40 + \text{Hazard} \times 10 \right)\right)$$

### 3. Multi-Objective Fitness Function
$$\text{Fitness} = 0.60 \cdot \left(\frac{\text{Lives Saved}}{\text{Total Population}}\right) + 0.25 \cdot \left(\frac{1}{1 + \frac{T_{\max}}{60}}\right) + 0.15 \cdot \left(\frac{1}{1 + \frac{D_{\text{fleet}}}{500}}\right)$$

### 4. Operational Constraints
- **Capacity Constraint (Hard)**: $\sum_{i \in \text{Route}(s)} \text{Pop}(i) \le \text{Capacity}(s), \quad \forall s \in \text{Fleet}$
- **Base Departure & Return (Hard)**: $\text{Route}(s)[0] = \text{Port Royal}, \quad \text{Route}(s)[\text{end}] = \text{Port Royal}$
- **No Island Left Stranded Unnecessarily**: Maximizes lives rescued within available fleet capacity.

### Algorithm Descriptions
- **Greedy Heuristic**: Ranks all islands by urgency, evaluates marginal detour costs for each available ship with remaining capacity, and applies Nearest Neighbor with 2-Opt local search on individual routes. Computes in under 50ms.
- **Genetic Algorithm**: Encodes candidate fleet assignments into chromosome representations. Applies tournament selection, uniform crossover respecting ship capacities, random swap mutations, and elitism preservation over configurable generations.
- **Hybrid Solver**: Combines the best of both approaches by injecting the greedy solution as Generation 0 elite seed into the genetic search space. This guarantees solutions that are strictly equal or superior to the greedy heuristic baseline.

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI**: Asynchronous high-performance REST & WebSocket server
- **Uvicorn**: ASGI web server
- **Pydantic v2**: Strict schema validation and data integrity
- **WebSockets**: Real-time simulation telemetry streaming

### Frontend
- **React 19**
- **TypeScript**
- **Vite**: Ultra-fast module bundler & development server
- **Leaflet**: Interactive cartographic mapping & route polyline rendering
- **Three.js**: 3D interactive Rescue Globe on the landing page
- **Lucide React**: Clean SVG icon system
- **Canvas-Confetti**: Mission completion celebration effects
- **Web Audio API**: Procedural maritime soundscapes (ship's bell, cannons, fanfare)

### Testing & Quality Assurance
- **Pytest**: Backend unit & integration test runner
- **pytest-asyncio & HTTPX**: Asynchronous endpoint testing
- **Oxlint**: High-speed frontend linter

---

## 📂 Project Structure

```text
PirateRescue AI/
├── pirate_backend/
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── genetic_algorithm.py      # Multi-objective genetic metaheuristic
│   │   ├── greedy_algorithm.py       # Priority-first nearest-neighbor solver
│   │   └── hybrid_solver.py          # Greedy-seeded genetic solver
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py               # Pydantic configuration & environment variables
│   ├── data/
│   │   └── standardized_scenarios.json # Benchmark Caribbean disaster dataset
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── cors_handler.py           # CORS middleware configuration
│   │   └── error_handler.py          # Global exception handler
│   ├── models/
│   │   ├── __init__.py
│   │   ├── island.py                 # Island and IslandStatus models
│   │   ├── rescue_plan.py            # Plan, Route, Step, and Solve models
│   │   └── ship.py                   # RescueShip fleet model
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── live.py                   # WebSocket simulation endpoint (/api/live/ws)
│   │   ├── plans.py                  # Rescue plan retrieval endpoints
│   │   ├── scenarios.py              # Scenario catalog & creation endpoints
│   │   └── solve.py                  # Solver & side-by-side comparison endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── distance_service.py       # Haversine distance & navigational math
│   │   ├── scenario_service.py       # Scenario loader & custom scenario manager
│   │   └── urgency_service.py        # Urgency scoring calculation engine
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py               # Test fixtures & sample datasets
│   │   ├── test_algorithms.py        # Algorithm constraint & quality tests
│   │   ├── test_api.py               # API route integration tests
│   │   └── test_distance.py          # Haversine & geometric calculation tests
│   ├── .env.example                  # Backend environment template
│   ├── main.py                       # FastAPI application entrypoint
│   └── requirements.txt              # Python dependencies
│
├── pirate_frontend/
│   ├── public/                       # Static cartographic textures and assets
│   ├── src/
│   │   ├── assets/                   # Images and SVG icons
│   │   ├── components/
│   │   │   ├── LandingPage/          # Hero landing screen & Three.js 3D globe
│   │   │   ├── AlgorithmCompareModal.tsx # Side-by-side benchmark comparison
│   │   │   ├── CompassRoseWatermark.tsx  # Antique compass UI watermark
│   │   │   ├── FleetStatus.tsx       # Fleet cards & deployment panel
│   │   │   ├── Header.tsx            # Navigation, scenario selector, solver buttons
│   │   │   ├── IslandTriage.tsx      # Priority triage sidebar
│   │   │   ├── MapView.tsx           # Interactive Leaflet nautical map
│   │   │   ├── MetricsHUD.tsx        # High-level mission statistics HUD
│   │   │   ├── ReplayControls.tsx    # Playback scrubber & simulation controls
│   │   │   └── ScenarioBuilderModal.tsx # Custom scenario generator modal
│   │   ├── services/
│   │   │   ├── api.ts                # REST API client
│   │   │   └── soundService.ts       # Web Audio API sound synthesis
│   │   ├── styles/                   # CSS stylesheets and theme tokens
│   │   ├── types/                    # TypeScript interfaces and types
│   │   ├── utils/                    # Navigation math & geo-routing utilities
│   │   ├── App.tsx                   # Main React dashboard component
│   │   ├── index.css                 # Global styling
│   │   └── main.tsx                  # React DOM entry point
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── tsconfig.json                 # TypeScript project configuration
│   └── vite.config.ts                # Vite configuration with API reverse-proxy
│
├── .env.example                      # Root environment variable template
├── .gitignore                        # Git exclusion rules
├── README.md                         # Project documentation
├── start_all.ps1                     # One-click PowerShell launcher (Backend + Frontend)
├── start_backend.bat                 # Windows batch launcher for backend
└── start_frontend.bat                # Windows batch launcher for frontend
```

---

## 🚀 Installation & Quick Start

### Prerequisites
- **Python 3.11+** installed and added to `PATH`
- **Node.js 18+** and `npm` installed
- **Git** installed

### Option A: One-Click Launch (Windows PowerShell)
```powershell
./start_all.ps1
```
This automatically launches the FastAPI backend on port 8000 and the React dashboard on port 3000.

---

### Option B: Manual Setup

#### 1. Clone Repository & Enter Directory
```bash
git clone https://github.com/your-username/PirateRescue-AI.git
cd PirateRescue-AI
```

#### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd pirate_backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### 3. Frontend Setup (React + Vite)
In a separate terminal:
```bash
# Navigate to frontend directory
cd pirate_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

The project includes pre-configured defaults, allowing immediate execution without manual configuration. To customize ports or behavior:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Adjust the variables as desired:
   ```env
   HOST=0.0.0.0
   PORT=8000
   DEBUG=true
   ENVIRONMENT=development
   ```
3. Never commit real `.env` files to Git (already protected in `.gitignore`).

---

## 📡 API Reference

The FastAPI backend exposes interactive OpenAPI documentation at `/docs`. Primary endpoints include:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and version metadata |
| `GET` | `/` | API index or static React production bundle |
| `GET` | `/api/scenarios` | Returns all available standardized & custom Caribbean disaster scenarios |
| `GET` | `/api/scenarios/base/port` | Retrieves Port Royal staging base coordinates |
| `GET` | `/api/scenarios/{scenario_id}` | Retrieves details for a specific disaster scenario |
| `POST` | `/api/scenarios` | Registers a newly created custom disaster scenario |
| `POST` | `/api/solve` | Solves rescue plan using requested solver (`greedy`, `genetic`, or `hybrid`) |
| `POST` | `/api/solve/compare` | Runs all 3 solvers side-by-side and returns comparative benchmark metrics |
| `GET` | `/api/plans` | Lists recent solved rescue plans |
| `GET` | `/api/plans/{plan_id}` | Fetches a specific rescue plan by ID |
| `WS` | `/api/live/ws` | Bidirectional WebSocket streaming simulation telemetry and vessel headings |

---

## 🎬 Hackathon Demo Flow

To demonstrate the full capabilities of PirateRescue AI to judges, recruiters, or evaluators:

1. **Launch**: Open [http://localhost:3000](http://localhost:3000) to view the 3D Rescue Globe and click **Enter War Room**.
2. **Select Scenario**: Choose **The Gale of Tortuga** or **The Kraken's Wake** from the scenario dropdown.
3. **Review Island Priorities**: Inspect the **Island Triage** left sidebar. Note how islands with higher injured and vulnerable ratios receive elevated priority scores.
4. **Inspect Fleet Status**: Review the **Fleet Operations** right sidebar to examine vessel capacities, speeds, and readiness.
5. **Solve via Greedy**: Select **Greedy Heuristic** and click **Generate Rescue Plan**. Observe the instant sub-50ms dispatch plan.
6. **Solve via Hybrid**: Switch solver to **Hybrid Solver** and re-solve to observe route optimization and fuel efficiency improvements.
7. **Compare Algorithms**: Click **Compare Solvers** to view the modal displaying real-time metrics (Greedy vs. Genetic vs. Hybrid).
8. **View Cartography**: Observe the color-coded vessel routes connecting Port Royal to assigned islands on the interactive map.
9. **Simulate Mission**: Click **Start Simulation**. Ships navigate along their assigned paths, dynamically picking up survivors and updating capacities.
10. **Test Scrubber**: Use the playback controls at the bottom to adjust playback speed (`0.5x` to `5x`) or scrub the timeline.
11. **Forge Scenario**: Click **Forge Scenario** to add a custom emergency and verify system re-optimization.

---

## 🧪 Automated Test Suite

The automated test suite verifies algorithm constraint adherence, Haversine trigonometry accuracy, and API contracts:

```bash
python -m pytest pirate_backend/tests
```

### Test Coverage Highlights
- **`test_distance.py`** (5 tests):
  - Haversine distance accuracy against known geographical benchmarks.
  - Nautical travel time and speed calculations.
  - Initial compass bearing calculations.
  - Intermediate coordinate interpolation.
- **`test_algorithms.py`** (3 tests):
  - Strict ship capacity constraint satisfaction.
  - Genetic algorithm solution validity.
  - Hybrid solver monotonicity (guarantees quality $\ge$ Greedy baseline).
- **`test_api.py`** (4 tests):
  - Health check endpoint verification.
  - Scenario catalog listing.
  - Single scenario lookup.
  - Solve API endpoint integration.

---

## 👥 Team

### Team ByteForce
- **Achievement**: 3rd Place / 3rd Rank
- **Problem Statement**: PS #05 — Pirate Island Rescue

---

## 🔮 Future Scope

- **Real-Time NOAA & Weather Feeds**: Incorporating live storm tracks, hurricane wind speeds, and sea wave height into dynamic route detours.
- **AIS Vessel Tracking**: Integrating live automatic identification system (AIS) transponder feeds for real-world maritime vessel positions.
- **Multi-Trip Vessel Scheduling**: Enabling cutters to drop off evacuees at secondary atolls and return to sea for subsequent rescue runs.
- **Machine Learning ETA Prediction**: Enhancing static speed calculations with ocean current and sea state machine learning models.
- **Emergency Dispatch Integration**: Exporting rescue plans to standard CAP (Common Alerting Protocol) formats for civil defense systems.

---

## ⚠️ Disclaimer

This project is a hackathon prototype developed by Team ByteForce and uses simulated disaster scenarios. It is intended for algorithmic demonstration and research purposes and is not certified for direct real-world emergency deployment without extensive validation, testing, and formal integration with maritime authorities and disaster management organizations.
