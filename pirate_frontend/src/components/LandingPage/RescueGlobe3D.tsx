import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DisasterLocation {
  name: string;
  lat: number;
  lng: number;
  urgency: 'BASE' | 'CRITICAL' | 'HIGH' | 'MEDIUM';
  souls?: number;
  vessel?: string;
  color: number;
}

const LOCATIONS: DisasterLocation[] = [
  { name: 'PORT ROYAL (HQ)', lat: 17.936, lng: -76.841, urgency: 'BASE', color: 0xF1D48A },
  { name: 'TORTUGA CITADEL', lat: 20.054, lng: -72.787, urgency: 'CRITICAL', souls: 360, vessel: 'The Black Pearl', color: 0xFF4D4D },
  { name: 'NASSAU FORTRESS', lat: 25.047, lng: -77.355, urgency: 'CRITICAL', souls: 420, vessel: "Queen Anne's Revenge", color: 0xFF6B4A },
  { name: 'GRAND CAYMAN', lat: 19.313, lng: -81.254, urgency: 'HIGH', souls: 260, vessel: 'Sea Viper', color: 0xE5A93C },
  { name: 'SHIPWRECK COVE', lat: 19.820, lng: -75.980, urgency: 'HIGH', souls: 290, vessel: 'Flying Dutchman', color: 0x38D9A9 },
  { name: 'SAN JUAN OUTPOST', lat: 18.465, lng: -66.105, urgency: 'MEDIUM', souls: 180, vessel: 'Royal Fortune', color: 0x4DABF7 },
];

/**
 * Converts geographic latitude & longitude to 3D Cartesian coordinates on sphere
 */
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Generates razor-sharp high-contrast nautical cartography texture
 */
function createHighDetailCartographyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Deep Ocean Gradient with rich maritime teal-sapphire undertones
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0A1724');
  oceanGrad.addColorStop(0.3, '#102A3D');
  oceanGrad.addColorStop(0.5, '#163852');
  oceanGrad.addColorStop(0.7, '#102A3D');
  oceanGrad.addColorStop(1, '#0A1724');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Vintage Navigation Graticule Grid (Luminous Brass Lines)
  ctx.strokeStyle = 'rgba(212, 175, 100, 0.22)';
  ctx.lineWidth = 1.2;

  for (let lat = -80; lat <= 80; lat += 15) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  for (let lng = -180; lng <= 180; lng += 15) {
    const x = ((lng + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Golden Equator & Tropic Lines
  ctx.strokeStyle = 'rgba(245, 212, 138, 0.65)';
  ctx.lineWidth = 2.4;
  ctx.strokeRect(0, canvas.height * 0.5 - 1.5, canvas.width, 3);

  // 3. Helper conversion
  const toX = (lng: number) => ((lng + 180) / 360) * canvas.width;
  const toY = (lat: number) => ((90 - lat) / 180) * canvas.height;

  // 4. Vibrant Golden Landmasses with High-Contrast Outlines
  ctx.fillStyle = '#C8A059'; // Rich antique gold parchment
  ctx.strokeStyle = '#3A1E0B'; // Deep walnut border
  ctx.lineWidth = 3.5;

  const drawCoast = (pts: [number, number][]) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(toX(pts[0][0]), toY(pts[0][1]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(toX(pts[i][0]), toY(pts[i][1]));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner glowing reef highlight
    ctx.strokeStyle = 'rgba(255, 235, 170, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = '#3A1E0B';
    ctx.lineWidth = 3.5;
  };

  // North America / Gulf Coast / Central America
  drawCoast([
    [-86, 31], [-82, 30], [-80.5, 27], [-80, 25], [-81, 24.5], [-82, 25],
    [-82.8, 28], [-84, 30], [-87, 30.5], [-90, 29.5], [-94, 29.5], [-97, 26],
    [-97.5, 22], [-92, 19], [-90, 20.5], [-87.5, 21.5], [-87, 18], [-83, 15],
    [-83, 10], [-79.5, 9], [-77, 8], [-75, 10.5], [-71, 11.5], [-67, 10.5],
    [-61, 10], [-55, 6], [-50, 0], [-40, -5], [-45, -20], [-60, -35],
    [-70, -50], [-74, -45], [-70, -25], [-76, -10], [-80, 0], [-78, 8],
    [-82, 9.5], [-85, 14], [-90, 16], [-96, 20], [-102, 25], [-96, 31],
  ]);

  // Cuba
  drawCoast([
    [-84.8, 21.8], [-83.5, 22.8], [-81, 23.2], [-78, 22.2], [-75, 20.8],
    [-74.2, 20.2], [-76, 19.8], [-78, 20.4], [-82, 21.8], [-84.5, 21.6],
  ]);

  // Hispaniola (Haiti & Dominican Republic)
  drawCoast([
    [-74.4, 18.6], [-72.8, 19.9], [-69.8, 19.9], [-68.3, 18.6],
    [-69, 18.2], [-71.4, 18.2], [-72.5, 18.1], [-74.4, 18.6],
  ]);

  // Jamaica
  drawCoast([
    [-78.4, 18.4], [-76.8, 18.4], [-76.2, 17.9], [-77.2, 17.7], [-78.3, 18.1],
  ]);

  // Bahamas archipelago
  drawCoast([[-78, 26.5], [-77.2, 26.5], [-77, 26], [-78, 26]]);
  drawCoast([[-77.8, 25.1], [-77.2, 25.1], [-77, 24.5], [-77.7, 24.5]]);
  drawCoast([[-76.3, 24.8], [-75.5, 24.2], [-75.8, 23.5], [-76.5, 24.2]]);

  // Puerto Rico
  drawCoast([[-67.2, 18.5], [-65.6, 18.5], [-65.6, 17.9], [-67.2, 17.9]]);

  // 5. Ornate Nautical Compass Rose
  const cx = toX(-64);
  const cy = toY(27);
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(235, 195, 120, 0.75)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const isMajor = i % 2 === 0;
    const len = isMajor ? 44 : 26;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle - 0.12) * 16, Math.sin(angle - 0.12) * 16);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.closePath();
    ctx.fillStyle = isMajor ? '#C59A45' : '#8C2314';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle + 0.12) * 16, Math.sin(angle + 0.12) * 16);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.closePath();
    ctx.fillStyle = '#F5E3BD';
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates 3D Location Beacon with elevated spindle, crystal orb, and crisp 3D text badge
 */
function createLocationBeacon(loc: DisasterLocation, radius: number): {
  group: THREE.Group;
  pulseWave: THREE.Mesh;
} {
  const group = new THREE.Group();
  const pos = latLngToVec3(loc.lat, loc.lng, radius);
  group.position.copy(pos);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

  const isBase = loc.urgency === 'BASE';

  // 1. Polished Brass Spindle Base
  const spindleGeo = new THREE.CylinderGeometry(0.010, 0.004, 0.14, 8);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xF1D48A,
    metalness: 0.85,
    roughness: 0.2,
  });
  const spindle = new THREE.Mesh(spindleGeo, brassMat);
  spindle.position.y = 0.07;
  group.add(spindle);

  // 2. Glowing Crystal Beacon Orb
  const beaconGeo = new THREE.SphereGeometry(0.038, 16, 16);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: loc.color,
    emissive: loc.color,
    emissiveIntensity: 0.9,
    roughness: 0.15,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 0.14;
  group.add(beacon);

  // 3. Expanding Surface Pulse Ring
  const waveGeo = new THREE.RingGeometry(0.01, 0.04, 24);
  const waveMat = new THREE.MeshBasicMaterial({
    color: loc.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const pulseWave = new THREE.Mesh(waveGeo, waveMat);
  pulseWave.rotation.x = Math.PI / 2;
  pulseWave.position.y = 0.005;
  group.add(pulseWave);

  // 4. High-Contrast Readable Placard Badge
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 256;
  badgeCanvas.height = 70;
  const bctx = badgeCanvas.getContext('2d');
  if (bctx) {
    bctx.fillStyle = isBase ? 'rgba(28, 48, 68, 0.94)' : 'rgba(24, 18, 14, 0.94)';
    bctx.strokeStyle = isBase ? '#F1D48A' : loc.urgency === 'CRITICAL' ? '#FF6B6B' : '#E5A93C';
    bctx.lineWidth = 3;
    bctx.beginPath();
    bctx.roundRect(4, 4, 248, 62, 10);
    bctx.fill();
    bctx.stroke();

    bctx.fillStyle = '#FFFFFF';
    bctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText(loc.name.split(' ')[0], 128, 28);

    bctx.font = '15px system-ui, -apple-system, sans-serif';
    bctx.fillStyle = isBase ? '#F1D48A' : '#FFEAA7';
    bctx.fillText(isBase ? 'FLEET BASE HQ' : `${loc.souls} SOULS • DISTRESS`, 128, 52);
  }

  const badgeTex = new THREE.CanvasTexture(badgeCanvas);
  badgeTex.needsUpdate = true;
  const badgeMat = new THREE.MeshBasicMaterial({
    map: badgeTex,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const badgePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.09), badgeMat);
  badgePlane.position.y = 0.22;
  group.add(badgePlane);

  return { group, pulseWave };
}

/**
 * Creates 3D Miniature Galleon Ship with wooden hull, square sails, and lanterns
 */
function createMiniGalleon(colorHue: number): THREE.Group {
  const ship = new THREE.Group();

  // Hull
  const hullGeo = new THREE.ConeGeometry(0.045, 0.12, 5);
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.scale(0.5, 0.35, 1.2);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x3E2415,
    roughness: 0.6,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  ship.add(hull);

  // Sterncastle
  const sternGeo = new THREE.BoxGeometry(0.035, 0.03, 0.03);
  const stern = new THREE.Mesh(sternGeo, hullMat);
  stern.position.set(0, 0.015, -0.045);
  ship.add(stern);

  // Masts
  const mastMat = new THREE.MeshStandardMaterial({ color: 0xF5E3BD });
  const mastGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.09, 6);

  const foreMast = new THREE.Mesh(mastGeo, mastMat);
  foreMast.position.set(0, 0.045, 0.02);
  ship.add(foreMast);

  const mainMast = new THREE.Mesh(mastGeo, mastMat);
  mainMast.position.set(0, 0.05, -0.015);
  mainMast.scale.set(1, 1.15, 1);
  ship.add(mainMast);

  // Square Billowing Sails
  const sailMat = new THREE.MeshStandardMaterial({
    color: 0xFFF9EE,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const sailGeo = new THREE.PlaneGeometry(0.045, 0.035);

  const sail1 = new THREE.Mesh(sailGeo, sailMat);
  sail1.position.set(0, 0.05, 0.02);
  sail1.rotation.y = Math.PI / 2;
  ship.add(sail1);

  const sail2 = new THREE.Mesh(sailGeo, sailMat);
  sail2.position.set(0, 0.06, -0.015);
  sail2.scale.set(1.2, 1.1, 1);
  sail2.rotation.y = Math.PI / 2;
  ship.add(sail2);

  // Stern Lantern (Glowing light)
  const lanternGeo = new THREE.SphereGeometry(0.009, 8, 8);
  const lanternMat = new THREE.MeshBasicMaterial({ color: colorHue });
  const lantern = new THREE.Mesh(lanternGeo, lanternMat);
  lantern.position.set(0, 0.035, -0.06);
  ship.add(lantern);

  ship.scale.setScalar(0.7);
  return ship;
}

export const RescueGlobe3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // 1. Scene & Perspective Camera calibrated with generous padding (ZERO clipping)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 0.06, 3.85);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup: Warm Caribbean sunlight & ambient nautical bounce
    const ambientLight = new THREE.AmbientLight(0xFFF0D5, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFE5B4, 2.2);
    sunLight.position.set(4, 5, 4);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x76B5DE, 1.4);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // 4. Root Moving Navigation Sphere Group
    const sphereRoot = new THREE.Group();
    scene.add(sphereRoot);

    // Dynamic rotation tilt matching Caribbean chart angle
    sphereRoot.rotation.x = 0.22;
    sphereRoot.rotation.y = 1.35;

    const CORE_RADIUS = 1.10;

    // 5. Luminous Antique World Map Core Sphere
    const textureLoader = new THREE.TextureLoader();
    const worldMapTexture = textureLoader.load(
      '/antique-world-map.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        sphereMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Falling back to /world-map-texture.jpg', err);
        textureLoader.load('/world-map-texture.jpg', (fallbackTex) => {
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          sphereMat.map = fallbackTex;
          sphereMat.needsUpdate = true;
        });
      }
    );

    const sphereGeo = new THREE.SphereGeometry(CORE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: worldMapTexture,
      roughness: 0.45,
      metalness: 0.12,
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphereRoot.add(coreSphere);

    // Ethereal Atmosphere Glow Shell
    const atmoGeo = new THREE.SphereGeometry(CORE_RADIUS * 1.018, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xE2C07D,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    sphereRoot.add(atmo);

    // 6. Astrolabe Armillary Gimbal Rings (Nested moving brass rings)
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.88,
      roughness: 0.22,
    });

    const darkBrassMat = new THREE.MeshStandardMaterial({
      color: 0x8C682A,
      metalness: 0.82,
      roughness: 0.35,
    });

    // Ring 1: Primary Meridian Ring (Vertical)
    const meridianGeo = new THREE.TorusGeometry(1.36, 0.022, 16, 80);
    const meridianRing = new THREE.Mesh(meridianGeo, brassMat);
    scene.add(meridianRing);

    // Ring 2: Equatorial Horizon Ring (Horizontal with graduation rivets)
    const horizonGeo = new THREE.TorusGeometry(1.40, 0.022, 16, 80);
    const horizonRing = new THREE.Mesh(horizonGeo, brassMat);
    horizonRing.rotation.x = Math.PI / 2;
    scene.add(horizonRing);

    // Ring 3: Tilted Ecliptic Zodiac Ring (Tilted at 23.5 degrees)
    const eclipticGeo = new THREE.TorusGeometry(1.34, 0.018, 16, 72);
    const eclipticRing = new THREE.Mesh(eclipticGeo, darkBrassMat);
    eclipticRing.rotation.x = (23.5 * Math.PI) / 180;
    eclipticRing.rotation.y = Math.PI / 6;
    sphereRoot.add(eclipticRing);

    // Decorative Compass Rivets on the Ecliptic Ring
    const rivetGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const rivetMat = new THREE.MeshStandardMaterial({ color: 0xF8E8C8, metalness: 0.9, roughness: 0.1 });
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.position.set(Math.cos(angle) * 1.34, Math.sin(angle) * 1.34, 0);
      eclipticRing.add(rivet);
    }

    // Ring 4: Fast Inner Astrolabe Gyro Ring
    const innerRingGeo = new THREE.TorusGeometry(1.24, 0.014, 16, 64);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0xE8C872,
      metalness: 0.92,
      roughness: 0.15,
    });
    const innerGyroRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    sphereRoot.add(innerGyroRing);

    // 7. Beacons & Pulsing Radar Wave Elements
    const beaconWaves: THREE.Mesh[] = [];
    LOCATIONS.forEach(loc => {
      const { group: beaconGroup, pulseWave } = createLocationBeacon(loc, CORE_RADIUS);
      sphereRoot.add(beaconGroup);
      beaconWaves.push(pulseWave);
    });

    // 8. Luminous Trajectory Arcs & Speeding Energy Comets
    const basePos = latLngToVec3(LOCATIONS[0].lat, LOCATIONS[0].lng, CORE_RADIUS);

    interface RescueArcTrack {
      curve: THREE.QuadraticBezierCurve3;
      comet: THREE.Mesh;
      cometLight: THREE.PointLight;
      speed: number;
      progress: number;
    }
    const rescueArcs: RescueArcTrack[] = [];

    const cometGeo = new THREE.SphereGeometry(0.022, 12, 12);

    LOCATIONS.slice(1).forEach((dest, i) => {
      const destPos = latLngToVec3(dest.lat, dest.lng, CORE_RADIUS);
      const midPoint = new THREE.Vector3().addVectors(basePos, destPos).multiplyScalar(0.5);
      const dist = basePos.distanceTo(destPos);
      midPoint.normalize().multiplyScalar(CORE_RADIUS + dist * 0.32 + 0.08);

      const curve = new THREE.QuadraticBezierCurve3(basePos, midPoint, destPos);
      const curvePts = curve.getPoints(36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
      const arcMat = new THREE.LineBasicMaterial({
        color: dest.color,
        transparent: true,
        opacity: 0.75,
        linewidth: 2,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      sphereRoot.add(arcLine);

      // Speeding Energy Comet
      const cometMat = new THREE.MeshBasicMaterial({ color: 0xFFF9E6 });
      const comet = new THREE.Mesh(cometGeo, cometMat);

      const cometLight = new THREE.PointLight(dest.color, 0.8, 0.5);
      comet.add(cometLight);

      sphereRoot.add(comet);

      rescueArcs.push({
        curve,
        comet,
        cometLight,
        speed: 0.005 + i * 0.0015,
        progress: (i * 0.22) % 1.0,
      });
    });

    // 9. Active Miniature Galleons Sailing along Sea Lanes
    interface SailingVessel {
      mesh: THREE.Group;
      latStart: number;
      lngStart: number;
      speed: number;
      angle: number;
      radiusOrbit: number;
    }
    const sailingFleet: SailingVessel[] = [];

    const ship1 = createMiniGalleon(0xF1D48A);
    sphereRoot.add(ship1);
    sailingFleet.push({ mesh: ship1, latStart: 18.5, lngStart: -78.0, speed: 0.006, angle: 0, radiusOrbit: CORE_RADIUS });

    const ship2 = createMiniGalleon(0x38D9A9);
    sphereRoot.add(ship2);
    sailingFleet.push({ mesh: ship2, latStart: 23.0, lngStart: -75.0, speed: 0.008, angle: 2.1, radiusOrbit: CORE_RADIUS });

    const ship3 = createMiniGalleon(0xFF6B4A);
    sphereRoot.add(ship3);
    sailingFleet.push({ mesh: ship3, latStart: 19.0, lngStart: -68.0, speed: 0.007, angle: 4.2, radiusOrbit: CORE_RADIUS });

    // 10. Orbiting Celestial Stardust Cloud (Surrounding the sphere with magical depth)
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      const radiusP = 1.25 + Math.random() * 0.35;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;

      particlePos[p * 3] = radiusP * Math.cos(phi) * Math.cos(theta);
      particlePos[p * 3 + 1] = radiusP * Math.sin(phi);
      particlePos[p * 3 + 2] = radiusP * Math.cos(phi) * Math.sin(theta);

      // Mix of warm gold and aqua stars
      const isGold = Math.random() > 0.4;
      particleColors[p * 3] = isGold ? 0.95 : 0.4;
      particleColors[p * 3 + 1] = isGold ? 0.82 : 0.85;
      particleColors[p * 3 + 2] = isGold ? 0.45 : 0.95;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const stardustPoints = new THREE.Points(particleGeo, particleMat);
    scene.add(stardustPoints);

    // 11. Interactive Drag & Momentum Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = sphereRoot.rotation.y;
    let targetRotX = sphereRoot.rotation.x;

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
      if (container) container.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      targetRotY += deltaX * 0.005;
      targetRotX += deltaY * 0.005;
      targetRotX = Math.max(-0.85, Math.min(0.85, targetRotX));
    };

    const onUp = () => {
      isDragging = false;
      if (container) container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    container.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    // 12. Resize Handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 13. Animation Loop (Smooth 60 FPS)
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth idle auto-rotation
      if (!isDragging) {
        targetRotY += 0.0022;
      }
      sphereRoot.rotation.y += (targetRotY - sphereRoot.rotation.y) * 0.06;
      sphereRoot.rotation.x += (targetRotX - sphereRoot.rotation.x) * 0.06;

      // Gimbal ring kinetic movements
      meridianRing.rotation.y = elapsed * 0.12;
      horizonRing.rotation.z = -elapsed * 0.08;
      innerGyroRing.rotation.x = elapsed * 0.35;
      innerGyroRing.rotation.y = elapsed * 0.28;
      stardustPoints.rotation.y = -elapsed * 0.04;

      // Animate pulsing radar waves on distress waypoints
      beaconWaves.forEach((wave, wi) => {
        const waveProgress = (elapsed * 1.5 + wi * 0.4) % 1.0;
        const scale = 1.0 + waveProgress * 2.8;
        wave.scale.set(scale, scale, 1);
        (wave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - waveProgress * 0.8);
      });

      // Animate rescue trajectory comets
      rescueArcs.forEach(arc => {
        arc.progress = (arc.progress + arc.speed) % 1.0;
        const pt = arc.curve.getPointAt(arc.progress);
        arc.comet.position.copy(pt);
      });

      // Animate active sailing vessels
      sailingFleet.forEach(vessel => {
        vessel.angle += vessel.speed;
        const lat = vessel.latStart + Math.sin(vessel.angle) * 2.2;
        const lng = vessel.lngStart + Math.cos(vessel.angle) * 5.5;
        const shipPos = latLngToVec3(lat, lng, vessel.radiusOrbit + 0.012);
        vessel.mesh.position.copy(shipPos);

        // Next position to calculate forward heading
        const nextLat = vessel.latStart + Math.sin(vessel.angle + 0.05) * 2.2;
        const nextLng = vessel.lngStart + Math.cos(vessel.angle + 0.05) * 5.5;
        const nextPos = latLngToVec3(nextLat, nextLng, vessel.radiusOrbit + 0.012);

        const forward = nextPos.clone().sub(shipPos).normalize();
        const normal = shipPos.clone().normalize();
        const right = new THREE.Vector3().crossVectors(forward, normal).normalize();
        const correctedForward = new THREE.Vector3().crossVectors(normal, right).normalize();

        const rotMatrix = new THREE.Matrix4().makeBasis(right, normal, correctedForward.negate());
        vessel.mesh.quaternion.setFromRotationMatrix(rotMatrix);

        // Gentle ocean swell bobbing
        vessel.mesh.position.addScaledVector(normal, Math.sin(elapsed * 4 + vessel.angle) * 0.005);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 14. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      container.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      worldMapTexture.dispose();
      meridianGeo.dispose();
      horizonGeo.dispose();
      eclipticGeo.dispose();
      innerRingGeo.dispose();
      brassMat.dispose();
      darkBrassMat.dispose();
      innerRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '520px',
        maxHeight: '560px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        overflow: 'visible',
      }}
    />
  );
};
