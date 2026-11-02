import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const INITIAL_VALUES = {
  amplitude: 15,
  mass: 1,
  springConstant: 4,
  pendulumLength: 1.8,
  gravity: 9.81,
  speed: 1,
};

const PARAMETERS = [
  {
    key: "amplitude",
    label: "Amplitude",
    min: 5,
    max: 25,
    step: 1,
    valueLabel: (value) => `${value} cm`,
    explanation: "The greatest distance from equilibrium. More amplitude makes a wider swing, but does not change the ideal period.",
  },
  {
    key: "mass",
    label: "Mass",
    min: 0.25,
    max: 3,
    step: 0.05,
    valueLabel: (value) => `${Number(value).toFixed(2)} kg`,
    explanation: "A heavier spring mass takes longer to oscillate. Mass does not change the ideal pendulum period.",
  },
  {
    key: "springConstant",
    label: "Spring constant",
    min: 1,
    max: 12,
    step: 0.1,
    valueLabel: (value) => `${Number(value).toFixed(1)} N/m`,
    explanation: "A stiffer spring pulls back more strongly, so its mass oscillates faster and its period gets shorter.",
  },
  {
    key: "pendulumLength",
    label: "Pendulum length",
    min: 1.2,
    max: 2.5,
    step: 0.05,
    valueLabel: (value) => `${Number(value).toFixed(2)} m`,
    explanation: "A longer pendulum swings more slowly and has a longer period.",
  },
  {
    key: "gravity",
    label: "Gravity",
    min: 1,
    max: 20,
    step: 0.1,
    valueLabel: (value) => `${Number(value).toFixed(1)} m/s²`,
    explanation: "Stronger gravity pulls the pendulum back faster, so its period is shorter. It does not affect the ideal spring period.",
  },
  {
    key: "speed",
    label: "Simulation speed",
    min: 0.25,
    max: 2,
    step: 0.05,
    valueLabel: (value) => `${Number(value).toFixed(2)}×`,
    explanation: "This changes only how quickly the animation plays, not the physics values shown for either system.",
  },
];

function readSimulationColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    canvas: styles.getPropertyValue("--simulation-canvas").trim(),
    accent: styles.getPropertyValue("--accent").trim(),
    guide: styles.getPropertyValue("--text-muted").trim(),
  };
}

function useSimulationColors() {
  const [colors, setColors] = useState(readSimulationColors);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setColors(readSimulationColors()));
    observer.observe(root, { attributes: true, attributeFilter: ["data-band", "data-skin", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

function periodForSpring(mass, springConstant) {
  return 2 * Math.PI * Math.sqrt(mass / springConstant);
}

function periodForPendulum(length, gravity) {
  return 2 * Math.PI * Math.sqrt(length / gravity);
}

function OscillatingSpring({ values, playing, resetKey, onFrame, colors }) {
  const massRef = useRef();
  const elapsed = useRef(0);
  const lastReport = useRef(0);
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(81 * 3), 3),
    );
    const object = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: colors.accent }),
    );
    return object;
  }, [colors.accent]);

  useEffect(() => {
    line.geometry.dispose();
    line.material.dispose();
  }, [line]);

  useFrame((_, delta) => {
    if (playing) elapsed.current += delta * values.speed;
    const period = periodForSpring(values.mass, values.springConstant);
    const displacement = (values.amplitude / 100) * Math.cos((2 * Math.PI * elapsed.current) / period);
    const massY = -0.25 - displacement * 1.8;
    const topY = massY + 0.35;
    const turns = 8;
    const segments = 80;
    const position = line.geometry.getAttribute("position");
    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const y = 1.8 + (topY - 1.8) * progress;
      const x = -2 + (index === 0 || index === segments ? 0 : 0.13 * Math.sin(progress * turns * Math.PI * 2));
      position.array[index * 3] = x;
      position.array[index * 3 + 1] = y;
      position.array[index * 3 + 2] = 0;
    }
    position.needsUpdate = true;
    line.geometry.computeBoundingSphere();
    if (massRef.current) massRef.current.position.y = massY;

    lastReport.current += delta;
    if (lastReport.current >= 0.1) {
      lastReport.current = 0;
      onFrame(displacement);
    }
  });

  useEffect(() => {
    elapsed.current = 0;
  }, [resetKey]);

  return (
    <group>
      <mesh position={[-2, 1.95, 0]}>
        <boxGeometry args={[1.1, 0.12, 0.16]} />
        <meshStandardMaterial color="#34415f" />
      </mesh>
      <primitive object={line} />
      <mesh ref={massRef} position={[-2, -0.25, 0]}>
        <boxGeometry args={[0.65, 0.42, 0.42]} />
        <meshStandardMaterial color="#f07e66" />
      </mesh>
      <mesh position={[-2, -0.25, -0.3]}>
        <boxGeometry args={[1.7, 0.025, 0.06]} />
        <meshStandardMaterial color={colors.guide} />
      </mesh>
      <mesh position={[-2, -0.62, 0]}>
        <boxGeometry args={[0.015, 1.95, 0.08]} />
        <meshStandardMaterial color={colors.guide} />
      </mesh>
    </group>
  );
}

function OscillatingPendulum({ values, playing, resetKey, onFrame, colors }) {
  const bobRef = useRef();
  const elapsed = useRef(0);
  const lastReport = useRef(0);
  const rod = useMemo(
    () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(2 * 3), 3),
      );
      return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: colors.accent }));
    },
    [colors.accent],
  );

  useEffect(() => {
    rod.geometry.dispose();
    rod.material.dispose();
  }, [rod]);

  useFrame((_, delta) => {
    if (playing) elapsed.current += delta * values.speed;
    const period = periodForPendulum(values.pendulumLength, values.gravity);
    const angleAmplitude = (values.amplitude / 100) / values.pendulumLength;
    const angle = angleAmplitude * Math.cos((2 * Math.PI * elapsed.current) / period);
    const visualLength = 1.65;
    const bobX = 2 + visualLength * Math.sin(angle);
    const bobY = 1.8 - visualLength * Math.cos(angle);
    const position = rod.geometry.getAttribute("position");
    position.array.set([2, 1.8, 0, bobX, bobY, 0]);
    position.needsUpdate = true;
    rod.geometry.computeBoundingSphere();
    if (bobRef.current) bobRef.current.position.set(bobX, bobY, 0);

    lastReport.current += delta;
    if (lastReport.current >= 0.1) {
      lastReport.current = 0;
      onFrame(values.pendulumLength * Math.sin(angle));
    }
  });

  useEffect(() => {
    elapsed.current = 0;
  }, [resetKey]);

  return (
    <group>
      <mesh position={[2, 1.95, 0]}>
        <boxGeometry args={[1.1, 0.12, 0.16]} />
        <meshStandardMaterial color="#34415f" />
      </mesh>
      <mesh position={[2, 1.8, 0]}>
        <sphereGeometry args={[0.09, 20, 16]} />
        <meshStandardMaterial color="#34415f" />
      </mesh>
      <primitive object={rod} />
      <mesh ref={bobRef} position={[2, 0.15, 0]}>
        <sphereGeometry args={[0.24, 28, 20]} />
        <meshStandardMaterial color="#46a98b" />
      </mesh>
      <mesh position={[2, -0.48, 0]}>
        <boxGeometry args={[0.015, 1.95, 0.08]} />
        <meshStandardMaterial color={colors.guide} />
      </mesh>
    </group>
  );
}

function SimulationScene({ values, playing, resetKey, onSpringFrame, onPendulumFrame, colors }) {
  return (
    <>
      <color attach="background" args={[colors.canvas]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[0, 3, 5]} intensity={1.4} />
      <group scale={0.78}>
        <OscillatingSpring values={values} playing={playing} resetKey={resetKey} onFrame={onSpringFrame} colors={colors} />
        <OscillatingPendulum values={values} playing={playing} resetKey={resetKey} onFrame={onPendulumFrame} colors={colors} />
      </group>
    </>
  );
}

function TwoDimensionalFallback({ values }) {
  const springPeriod = periodForSpring(values.mass, values.springConstant);
  const pendulumPeriod = periodForPendulum(values.pendulumLength, values.gravity);
  return (
    <div className="shm-2d-fallback" role="img" aria-label="Static 2D diagram of both oscillating systems">
      <div className="shm-2d-diagram">
        <section>
          <strong>Spring–mass system</strong>
          <svg viewBox="0 0 220 190" aria-hidden="true">
            <path d="M55 20h110M110 20v17l-13 9 26 12-26 12 26 12-26 12 26 12-13 9v8" />
            <rect x="83" y="125" width="54" height="38" rx="6" />
            <path className="shm-2d-guide" d="M45 144h130" />
            <text x="145" y="139">equilibrium</text>
            <text x="119" y="180">restoring force points back</text>
          </svg>
        </section>
        <section>
          <strong>Simple pendulum</strong>
          <svg viewBox="0 0 220 190" aria-hidden="true">
            <path d="M40 25h140M110 25v105M110 25l55 91" />
            <circle cx="110" cy="130" r="13" />
            <circle cx="165" cy="116" r="13" />
            <path className="shm-2d-guide" d="M110 47a26 26 0 0 1 22 12" />
            <text x="137" y="58">small angle</text>
            <text x="112" y="155">bob</text>
          </svg>
        </section>
      </div>
      <p>These diagrams show the equilibrium position and the direction a restoring force acts.</p>
      <div className="shm-formula-row">
        <span>Spring period: <strong>{springPeriod.toFixed(2)} s</strong></span>
        <span>Pendulum period: <strong>{pendulumPeriod.toFixed(2)} s</strong></span>
        <span>Frequency: <strong>f = 1/T</strong></span>
      </div>
    </div>
  );
}

export default function SimpleHarmonicMotionSimulation() {
  const colors = useSimulationColors();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [playing, setPlaying] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [springDisplacement, setSpringDisplacement] = useState(values.amplitude / 100);
  const [pendulumDisplacement, setPendulumDisplacement] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [force2D, setForce2D] = useState(false);
  const springPeriod = periodForSpring(values.mass, values.springConstant);
  const pendulumPeriod = periodForPendulum(values.pendulumLength, values.gravity);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const reportSpring = useCallback((displacement) => setSpringDisplacement(displacement), []);
  const reportPendulum = useCallback((displacement) => setPendulumDisplacement(displacement), []);

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: Number(value) }));
  }

  function resetSimulation() {
    setValues(INITIAL_VALUES);
    setResetKey((value) => value + 1);
    setSpringDisplacement(INITIAL_VALUES.amplitude / 100);
    setPendulumDisplacement(0);
    setPlaying(false);
  }

  const useStaticView = reducedMotion || force2D;

  return (
    <div className="shm-simulation">
      <div className="shm-simulation-intro">
        <p>
          Compare a hanging spring and a simple pendulum. Move one control at a
          time and notice which system’s period changes.
        </p>
        {reducedMotion && (
          <p className="shm-motion-note" role="status">
            Reduced motion is on, so the still 2D diagram is shown instead of animation.
          </p>
        )}
      </div>

      <div className="shm-simulation-layout">
        <div className="shm-visual-column">
          {useStaticView ? (
            <TwoDimensionalFallback values={values} />
          ) : (
            <div className="shm-canvas" aria-label="Animated 3D spring-mass system and simple pendulum">
              <div className="shm-scene-legend" aria-hidden="true">
                <span>Spring–mass</span>
                <span>Simple pendulum</span>
              </div>
              <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                dpr={[1, 1.5]}
                fallback={<TwoDimensionalFallback values={values} />}
              >
                <SimulationScene
                  values={values}
                  playing={playing}
                  resetKey={resetKey}
                  onSpringFrame={reportSpring}
                  onPendulumFrame={reportPendulum}
                  colors={colors}
                />
              </Canvas>
            </div>
          )}
          <div className="shm-live-values" aria-live="polite">
            <article>
              <span>Spring displacement</span>
              <strong>{(springDisplacement * 100).toFixed(1)} cm</strong>
              <small>T = {springPeriod.toFixed(2)} s · f = {(1 / springPeriod).toFixed(2)} Hz</small>
            </article>
            <article>
              <span>Pendulum displacement</span>
              <strong>{(pendulumDisplacement * 100).toFixed(1)} cm</strong>
              <small>T = {pendulumPeriod.toFixed(2)} s · f = {(1 / pendulumPeriod).toFixed(2)} Hz</small>
            </article>
          </div>
          <div className="shm-transport-controls">
            <button className="shm-primary-button" type="button" onClick={() => setPlaying((value) => !value)}>
              {playing ? "Pause" : "Play"}
            </button>
            <button className="shm-secondary-button" type="button" onClick={resetSimulation}>
              Reset values
            </button>
            {!reducedMotion && (
              <button
                className="shm-secondary-button"
                type="button"
                aria-pressed={force2D}
                onClick={() => setForce2D((value) => !value)}
              >
                {force2D ? "Show 3D" : "2D explanation"}
              </button>
            )}
          </div>
        </div>

        <aside className="shm-controls" aria-label="Simulation parameters">
          <div className="shm-controls-heading">
            <div>
              <span className="shm-eyebrow">CHANGE A PARAMETER</span>
              <h3>What affects the motion?</h3>
            </div>
          </div>
          {PARAMETERS.map((parameter) => (
            <label className="shm-slider-control" key={parameter.key}>
              <span className="shm-slider-heading">
                <strong>{parameter.label}</strong>
                <output>{parameter.valueLabel(values[parameter.key])}</output>
              </span>
              <input
                type="range"
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
                value={values[parameter.key]}
                onChange={(event) => updateValue(parameter.key, event.target.value)}
                aria-label={parameter.label}
              />
              <small>{parameter.explanation}</small>
            </label>
          ))}
          <p className="shm-small-angle-note">
            The pendulum period uses the small-angle approximation. Its period
            is independent of mass and amplitude in this model.
          </p>
        </aside>
      </div>
    </div>
  );
}
