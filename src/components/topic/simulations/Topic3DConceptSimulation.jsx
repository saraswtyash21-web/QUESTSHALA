import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getConceptSimulationConfig } from "./simulationRegistry.js";
import "./Topic3DConceptSimulation.css";

const reducedMotionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const initialParameter = 50;

function useThemeColors() {
  const [colors, setColors] = useState(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      canvas: styles.getPropertyValue("--simulation-canvas").trim(),
      accent: styles.getPropertyValue("--accent").trim(),
      guide: styles.getPropertyValue("--text-muted").trim(),
    };
  });

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const styles = getComputedStyle(root);
      setColors({
        canvas: styles.getPropertyValue("--simulation-canvas").trim(),
        accent: styles.getPropertyValue("--accent").trim(),
        guide: styles.getPropertyValue("--text-muted").trim(),
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-band", "data-skin", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

function Bond({ start, end, color = "#c8d3df", radius = 0.055 }) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(to, from);
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={midpoint} quaternion={quaternion}><cylinderGeometry args={[radius, radius, direction.length(), 10]} /><meshStandardMaterial color={color} /></mesh>;
}

function Atom({ position, color, radius = 0.22 }) {
  return <mesh position={position}><sphereGeometry args={[radius, 28, 20]} /><meshStandardMaterial color={color} roughness={0.42} /></mesh>;
}

function MoleculeModel({ progress, angle, colors }) {
  const bondLength = 0.65 + progress * 0.006;
  const positions = [[-bondLength, 0, 0], [0, 0.42, 0], [bondLength, 0, 0], [0, -0.5, 0.1]];
  return <group rotation={[0, angle, 0]}>
    {positions.map((position, index) => <Atom key={index} position={position} color={index === 0 ? "#91b9d8" : index === 1 ? "#e59d80" : index === 2 ? "#b7c98e" : "#c2a8d8"} radius={index === 1 ? 0.27 : 0.21} />)}
    {[[0, 1], [1, 2], [1, 3]].map(([start, end]) => <Bond key={`${start}-${end}`} start={positions[start]} end={positions[end]} color={colors.guide} />)}
  </group>;
}

function Model({ model, progress, colors }) {
  const animation = useRef();
  useFrame((_, delta) => {
    if (animation.current) animation.current.rotation.y += delta * (0.08 + progress * 0.003);
  });

  let content;
  switch (model) {
    case "atom": {
      const orbitRadius = 0.72 + progress * 0.003;
      content = <>
        <Atom position={[0, 0, 0]} color="#e79a7f" radius={0.35} />
        {[0, 1, 2].map((index) => <group key={index} rotation={[index * 0.9, index * 0.55, index * 0.45]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[orbitRadius, 0.012, 8, 72]} /><meshStandardMaterial color={colors.accent} /></mesh>
          <Atom position={[orbitRadius * Math.cos(index * 2.1), 0, orbitRadius * Math.sin(index * 2.1)]} color="#9bc7e8" radius={0.095} />
        </group>)}
      </>;
      break;
    }
    case "bonding":
    case "carbon":
      content = <MoleculeModel progress={progress} angle={model === "carbon" ? 0.55 + progress * 0.009 : 0.25} colors={colors} />;
      break;
    case "particles": {
      const spacing = 0.48 + progress * 0.009;
      const positions = [[-1, 0, -0.4], [-0.5, 0.35, 0.4], [0, -0.25, -0.3], [0.55, 0.4, -0.1], [1, -0.1, 0.4], [-0.2, 0.1, 0.9]];
      content = <group>{positions.map(([x, y, z], index) => <Atom key={index} position={[x * spacing, y * spacing, z * spacing]} color={index % 2 ? "#9bc7e8" : "#e5aa83"} radius={0.13} />)}</group>;
      break;
    }
    case "reaction": {
      const shift = (progress - 50) * 0.014;
      const positions = [[-0.8 - shift, 0.25, 0], [-0.8 - shift, -0.25, 0], [0.8 + shift, 0.25, 0], [0.8 + shift, -0.25, 0]];
      content = <group>{positions.map((position, index) => <Atom key={index} position={position} color={index % 2 ? "#9bc7e8" : "#e79a7f"} radius={0.2} />)}<Bond start={positions[0]} end={positions[1]} color={colors.guide} /><Bond start={positions[2]} end={positions[3]} color={colors.guide} /></group>;
      break;
    }
    case "cell":
      content = <group rotation={[0.2, 0, 0.2]}>
        <mesh scale={[1.3, 0.95, 0.8]}><sphereGeometry args={[1, 40, 28]} /><meshStandardMaterial color="#83b9a2" transparent opacity={0.24} roughness={0.6} /></mesh>
        <mesh><sphereGeometry args={[0.38, 32, 24]} /><meshStandardMaterial color="#9b8bc7" roughness={0.5} /></mesh>
        {[[0.65, 0.25, 0.25], [-0.55, 0.4, 0.25], [0.5, -0.45, -0.15], [-0.45, -0.35, -0.3]].map((position, index) => <Atom key={index} position={position} color={index % 2 ? "#e5aa83" : "#9bc7e8"} radius={0.12 + progress * 0.001} />)}
      </group>;
      break;
    case "mitosis":
      content = <group>
        <mesh position={[-0.52, 0, 0]} scale={[0.82 - progress * 0.002, 0.8, 0.72]}><sphereGeometry args={[0.8, 32, 22]} /><meshStandardMaterial color="#83b9a2" transparent opacity={0.26} /></mesh>
        <mesh position={[0.52, 0, 0]} scale={[0.82 - progress * 0.002, 0.8, 0.72]}><sphereGeometry args={[0.8, 32, 22]} /><meshStandardMaterial color="#83b9a2" transparent opacity={0.26} /></mesh>
        {[-1, 1].map((side) => <group key={side} position={[side * (0.5 + progress * 0.004), 0, 0]}>{[-1, 1].map((offset) => <mesh key={offset} position={[offset * 0.16, 0, 0]} rotation={[0, 0, Math.PI / 4]}><capsuleGeometry args={[0.045, 0.34, 5, 10]} /><meshStandardMaterial color="#c68e9d" /></mesh>)}</group>)}
      </group>;
      break;
    case "photosynthesis":
      content = <group rotation={[0.2, 0.2, -0.18]}>
        <mesh scale={[0.68 + progress * 0.003, 0.22, 0.12]}><sphereGeometry args={[1, 32, 22]} /><meshStandardMaterial color="#79b57e" /></mesh>
        <Bond start={[-0.78, 0, 0]} end={[0.78, 0, 0]} color="#d5e0bb" radius={0.025} />
        <Atom position={[-1.05, 0.2, 0]} color="#e6bf79" radius={0.14} />
        <Atom position={[1.05, -0.2, 0]} color="#9bc7e8" radius={0.14} />
        <Atom position={[0, 0.8, 0]} color="#e6bf79" radius={0.12} />
      </group>;
      break;
    case "heart":
      content = <group rotation={[0, 0, -0.12]}>
        <mesh position={[-0.3, 0.12, 0]} scale={[0.62, 0.76, 0.4]}><sphereGeometry args={[0.55, 32, 24]} /><meshStandardMaterial color="#bd7777" roughness={0.52} /></mesh>
        <mesh position={[0.35, 0.1, 0]} scale={[0.6, 0.72, 0.4]}><sphereGeometry args={[0.55, 32, 24]} /><meshStandardMaterial color="#9d777f" roughness={0.52} /></mesh>
        <Atom position={[-0.32, 0.15, 0.38]} color="#8fb5d0" radius={0.18} />
        <Atom position={[0.34, 0.15, 0.38]} color="#d98b7d" radius={0.18} />
        <Bond start={[-0.3, 0.4, 0]} end={[-0.42, 1.15, 0]} color="#8fb5d0" radius={0.09} />
        <Bond start={[0.3, 0.42, 0]} end={[0.42, 1.15, 0]} color="#d98b7d" radius={0.09} />
      </group>;
      break;
    case "food-chain":
      content = <group>{[-1.05, 0, 1.05].map((x, index) => <group key={x} position={[x, 0, 0]}><Atom position={[0, 0, 0]} color={["#85b779", "#d9b073", "#9aaed2"][index]} radius={0.28 + progress * 0.001} /><Atom position={[0, 0.37, 0]} color={["#a6cb98", "#e7bb91", "#b8c5d8"][index]} radius={0.19} /></group>)}<Bond start={[-0.62, 0, 0]} end={[-0.32, 0, 0]} color={colors.accent} radius={0.035} /><Bond start={[0.32, 0, 0]} end={[0.62, 0, 0]} color={colors.accent} radius={0.035} /></group>;
      break;
    case "water-cycle":
      content = <group>
        <mesh position={[0, -0.9, 0]} scale={[1.8, 0.25, 0.8]}><sphereGeometry args={[1, 32, 16]} /><meshStandardMaterial color="#709eb5" /></mesh>
        <mesh position={[-0.65, -0.25, -0.1]} rotation={[0, 0, -0.12]}><coneGeometry args={[0.72, 1.3, 5]} /><meshStandardMaterial color="#8b9b91" /></mesh>
        {[-0.5, 0, 0.5].map((x) => <Atom key={x} position={[x, 0.78, 0]} color="#aebfcb" radius={0.3} />)}
        {[-0.35, 0, 0.35].map((x) => <Atom key={x} position={[x, 0.25 - (progress / 100) * 0.4, 0.1]} color="#9bc7e8" radius={0.07} />)}
      </group>;
      break;
    case "ecosystem":
      content = <group>{[-1.05, 0, 1.05].map((x, index) => <group key={x} position={[x, -0.35, 0]}><mesh position={[0, 0.45 + progress * 0.002, 0]}><coneGeometry args={[0.38, 0.9, 7]} /><meshStandardMaterial color={index === 1 ? "#92b97a" : "#789f80"} /></mesh><mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.11, 0.15, 0.48, 10]} /><meshStandardMaterial color="#a98467" /></mesh></group>)}<mesh position={[0, -0.76, 0]} scale={[1.9, 0.18, 0.72]}><sphereGeometry args={[1, 32, 16]} /><meshStandardMaterial color="#7d9c7d" /></mesh></group>;
      break;
    case "earth":
      content = <group rotation={[0, progress * 0.025, 0]}>
        <mesh><sphereGeometry args={[1.05, 40, 32]} /><meshStandardMaterial color="#779eb3" /></mesh>
        <mesh scale={[1.01, 1.01, 1.01]}><sphereGeometry args={[1, 40, 32, 0, Math.PI * 1.55, 0, Math.PI]} /><meshStandardMaterial color="#7ca67c" /></mesh>
        <mesh position={[0.25, 0, 0.1]}><sphereGeometry args={[0.48, 28, 20]} /><meshStandardMaterial color="#d3a66f" /></mesh>
        <mesh position={[0.25, 0, 0.1]}><sphereGeometry args={[0.21, 22, 18]} /><meshStandardMaterial color="#d88770" /></mesh>
      </group>;
      break;
    case "force":
      content = <group>
        <mesh position={[-0.35, -0.3, 0]}><boxGeometry args={[0.9, 0.72, 0.72]} /><meshStandardMaterial color="#8babc0" /></mesh>
        <Bond start={[0.1, 0.25, 0]} end={[0.95 + progress * 0.007, 0.25, 0]} color="#e69a72" radius={0.065} />
        <mesh position={[0.95 + progress * 0.007, 0.25, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.13, 0.3, 12]} /><meshStandardMaterial color="#e69a72" /></mesh>
        <Bond start={[-0.8, -0.82, 0]} end={[0.9, -0.82, 0]} color={colors.guide} radius={0.025} />
      </group>;
      break;
    case "circuit":
      content = <group>
        <Bond start={[-0.9, 0.55, 0]} end={[0.9, 0.55, 0]} color="#d6b66f" radius={0.035} />
        <Bond start={[-0.9, -0.55, 0]} end={[0.9, -0.55, 0]} color="#d6b66f" radius={0.035} />
        <Bond start={[-0.9, 0.55, 0]} end={[-0.9, -0.55, 0]} color="#d6b66f" radius={0.035} />
        <Bond start={[0.9, 0.55, 0]} end={[0.9, -0.55, 0]} color="#d6b66f" radius={0.035} />
        <mesh position={[-0.9, 0, 0]}><boxGeometry args={[0.42, 0.6, 0.34]} /><meshStandardMaterial color="#88a8bb" /></mesh>
        <mesh position={[0.9, 0, 0]}><sphereGeometry args={[0.32 + progress * 0.001, 24, 18]} /><meshStandardMaterial color="#e6bf79" emissive="#6b4c22" emissiveIntensity={0.25} /></mesh>
        {[0, 1, 2].map((index) => <Atom key={index} position={[-0.45 + index * 0.42, 0.55, 0.06]} color={colors.accent} radius={0.07} />)}
      </group>;
      break;
    case "magnet":
      content = <group rotation={[0, 0, 0.18]}>
        <mesh position={[-0.52, 0, 0]}><boxGeometry args={[0.9, 0.48, 0.42]} /><meshStandardMaterial color="#9e7d8a" /></mesh>
        <mesh position={[0.52, 0, 0]}><boxGeometry args={[0.9, 0.48, 0.42]} /><meshStandardMaterial color="#849db2" /></mesh>
        {[0, 1, 2].map((index) => <mesh key={index} position={[0, 0.85 + index * 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.82 + index * 0.15 + progress * 0.001, 0.018, 6, 48, Math.PI]} /><meshStandardMaterial color={colors.accent} /></mesh>)}
      </group>;
    case "optics":
      content = <group>
        <mesh position={[0, 0, 0]}><boxGeometry args={[0.1, 1.8, 0.7]} /><meshStandardMaterial color="#91b9d8" transparent opacity={0.35} /></mesh>
        <Bond start={[-1.4, -0.35 + progress * 0.008, 0]} end={[0, 0, 0]} color="#e8bd79" radius={0.045} />
        <Bond start={[0, 0, 0]} end={[1.3, 0.5 + progress * 0.003, 0]} color="#e8bd79" radius={0.045} />
        <Atom position={[-1.4, -0.35 + progress * 0.008, 0]} color="#e8bd79" radius={0.08} />
      </group>;
      break;
    case "sound": {
      const points = [];
      for (let index = 0; index <= 60; index += 1) {
        const x = -1.5 + (index / 60) * 3;
        points.push(new THREE.Vector3(x, Math.sin(index * (0.13 + progress * 0.002)) * 0.45, 0));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      content = <group><mesh><tubeGeometry args={[curve, 80, 0.035, 8, false]} /><meshStandardMaterial color={colors.accent} /></mesh>{[-1.2, -0.6, 0, 0.6, 1.2].map((x, index) => <Atom key={index} position={[x, 0, 0.15]} color="#9bc7e8" radius={0.08} />)}</group>;
      break;
    }
    case "dna":
      content = <group>{Array.from({ length: 13 }, (_, index) => {
        const y = -1.1 + index * 0.18;
        const angle = index * (0.62 + progress * 0.001);
        const left = [-0.48 * Math.cos(angle), y, 0.48 * Math.sin(angle)];
        const right = [0.48 * Math.cos(angle), y, -0.48 * Math.sin(angle)];
        return <group key={index}><Atom position={left} color="#91b9d8" radius={0.065} /><Atom position={right} color="#d69c86" radius={0.065} />{index % 2 === 0 && <Bond start={left} end={right} color={colors.guide} radius={0.018} />}</group>;
      })}</group>;
      break;
    case "rotation":
      content = <group>
        <mesh><cylinderGeometry args={[0.78, 0.78, 0.14, 48]} /><meshStandardMaterial color={colors.accent} roughness={0.5} /></mesh>
        <mesh><cylinderGeometry args={[0.045, 0.045, 1.15, 16]} /><meshStandardMaterial color={colors.guide} /></mesh>
        {[0, 1, 2, 3].map((index) => {
          const angle = index * Math.PI / 2;
          return <Atom key={index} position={[0.62 * Math.cos(angle), 0.1, 0.62 * Math.sin(angle)]} color={index % 2 ? "#e5aa83" : "#9bc7e8"} radius={0.12} />;
        })}
      </group>;
      break;
    default:
      content = <Atom position={[0, 0, 0]} color={colors.accent} />;
  }

  return <group ref={animation}>{content}</group>;
}

function StaticModel({ config }) {
  let diagram;
  switch (config.model) {
    case "atom":
      diagram = <><circle cx="180" cy="90" r="13" fill="#d88770" /><ellipse cx="180" cy="90" rx="74" ry="28" fill="none" stroke="currentColor" strokeWidth="2" /><ellipse cx="180" cy="90" rx="74" ry="28" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(60 180 90)" /><circle cx="254" cy="90" r="6" fill="var(--accent)" /><circle cx="143" cy="28" r="6" fill="var(--accent)" /></>;
      break;
    case "bonding":
    case "carbon":
      diagram = <><line x1="120" y1="90" x2="180" y2="55" stroke="currentColor" strokeWidth="4" /><line x1="180" y1="55" x2="240" y2="90" stroke="currentColor" strokeWidth="4" /><line x1="180" y1="55" x2="180" y2="125" stroke="currentColor" strokeWidth="4" /><circle cx="120" cy="90" r="15" fill="#91b9d8" /><circle cx="180" cy="55" r="18" fill="var(--accent)" /><circle cx="240" cy="90" r="15" fill="#b7c98e" /><circle cx="180" cy="125" r="15" fill="#d69c86" /></>;
      break;
    case "particles":
      diagram = <>{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => <circle key={index} cx={100 + (index % 3) * 18} cy={70 + Math.floor(index / 3) * 18} r="6" fill="var(--accent)" />)}<text x="218" y="82" fill="currentColor">solid</text><text x="218" y="104" fill="currentColor">liquid</text><text x="218" y="126" fill="currentColor">gas</text></>;
      break;
    case "reaction":
      diagram = <><circle cx="96" cy="82" r="14" fill="#91b9d8" /><circle cx="122" cy="82" r="14" fill="#d69c86" /><text x="145" y="87" fill="currentColor">→</text><circle cx="206" cy="82" r="14" fill="#91b9d8" /><circle cx="232" cy="82" r="14" fill="#d69c86" /><circle cx="219" cy="106" r="14" fill="#91b9d8" /></>;
      break;
    case "cell":
      diagram = <><ellipse cx="180" cy="90" rx="83" ry="52" fill="#83b9a2" fillOpacity=".25" stroke="currentColor" strokeWidth="3" /><circle cx="174" cy="88" r="19" fill="#9b8bc7" /><circle cx="220" cy="76" r="8" fill="#d69c86" /><circle cx="137" cy="112" r="7" fill="#91b9d8" /></>;
      break;
    case "mitosis":
      diagram = <><circle cx="125" cy="90" r="34" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="235" cy="90" r="34" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M116 78l18 24m0-24l-18 24m110-24l18 24m0-24l-18 24" stroke="var(--accent)" strokeWidth="4" /></>;
      break;
    case "photosynthesis":
      diagram = <><circle cx="88" cy="67" r="22" fill="#e5aa83" /><path d="M164 109c12-48 54-57 71-45-3 40-30 65-71 45zm8-1 48-38" fill="#83b9a2" stroke="currentColor" strokeWidth="2" /><text x="180" y="150" fill="currentColor">light + water + CO₂ → sugar + O₂</text></>;
      break;
    case "heart":
      diagram = <><path d="M180 124c-42-25-57-52-38-68 14-12 30-4 38 8 8-12 24-20 38-8 19 16 4 43-38 68z" fill="#d88770" /><path d="M180 70v38m-21-19h42" stroke="currentColor" strokeWidth="3" /></>;
      break;
    case "food-chain":
      diagram = <><path d="M88 115V77m-14 20 14-24 14 24" stroke="#83b98a" strokeWidth="5" /><circle cx="164" cy="95" r="16" fill="#e5aa83" /><path d="M222 80l32 15-32 15z" fill="#91b9d8" /><path d="M112 95h28m42 0h24" stroke="currentColor" strokeWidth="3" /><text x="76" y="145" fill="currentColor">plant</text><text x="141" y="145" fill="currentColor">herbivore</text><text x="221" y="145" fill="currentColor">predator</text></>;
      break;
    case "water-cycle":
      diagram = <><circle cx="96" cy="62" r="19" fill="#e5aa83" /><path d="M176 88c-17 0-19-22-2-24 6-20 37-15 38 2 22-2 23 25 4 26z" fill="#91b9d8" /><path d="M192 101v26m-12-9 12 12 12-12M96 88v27m-9-9 9 10 9-10" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M74 139c30-12 57-12 86 0" fill="none" stroke="#91b9d8" strokeWidth="5" /></>;
      break;
    case "ecosystem":
      diagram = <><path d="M68 132h224" stroke="#83b98a" strokeWidth="7" /><path d="M104 120V76m-20 19 20-37 20 37" stroke="#83b98a" strokeWidth="5" /><circle cx="180" cy="104" r="13" fill="#e5aa83" /><path d="M221 86h35m-12-12 12 12-12 12" fill="none" stroke="var(--accent)" strokeWidth="3" /><circle cx="270" cy="45" r="16" fill="#e5aa83" /></>;
      break;
    case "earth":
      diagram = <><circle cx="180" cy="90" r="61" fill="#83b9a2" /><circle cx="180" cy="90" r="39" fill="#d3a66f" /><circle cx="180" cy="90" r="19" fill="#d88770" /><path d="M119 90h122" stroke="currentColor" strokeWidth="2" /></>;
      break;
    case "force":
      diagram = <><rect x="144" y="78" width="56" height="48" rx="4" fill="#91b9d8" /><path d="M200 101h67m-13-12 13 12-13 12M144 137H83m13-12-13 12 13 12" fill="none" stroke="currentColor" strokeWidth="3" /><text x="222" y="83" fill="currentColor">force</text><text x="60" y="162" fill="currentColor">friction</text></>;
      break;
    case "circuit":
      diagram = <><path d="M103 54h154v72H103z" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M119 54v72m9-48v24m113-20a15 15 0 1 0 0 30 15 15 0 1 0 0-30z" fill="none" stroke="var(--accent)" strokeWidth="3" /><text x="110" y="47" fill="currentColor">battery</text><text x="230" y="47" fill="currentColor">lamp</text></>;
      break;
    case "magnet":
      diagram = <><path d="M145 60h30v60h-30z" fill="#d88770" /><path d="M175 60h30v60h-30z" fill="#91b9d8" /><path d="M145 54c0-57 60-57 60 0M133 48c0-80 84-80 84 0" fill="none" stroke="currentColor" strokeWidth="2" /><text x="151" y="96" fill="currentColor">N</text><text x="181" y="96" fill="currentColor">S</text></>;
      break;
    case "optics":
      diagram = <><path d="M180 38v105" stroke="#91b9d8" strokeWidth="4" /><path d="M87 129l93-39 94-43" fill="none" stroke="#e5aa83" strokeWidth="3" /><circle cx="180" cy="90" r="5" fill="var(--accent)" /></>;
      break;
    case "sound":
      diagram = <><path d="M52 90c15-46 30 46 45 0s30-46 45 0 30 46 45 0 30-46 45 0 30 46 45 0 30-46 45 0" fill="none" stroke="var(--accent)" strokeWidth="4" /></>;
      break;
    case "dna":
      diagram = <><path d="M132 45c64 24 32 67 96 90m-96 0c64-24 32-67 96-90" fill="none" stroke="#91b9d8" strokeWidth="4" /><path d="M146 54l66 72m-66-52 44 48m-44-28 25 25m-25-64 25-25m-25 45 44-48m-44 68 66-72" stroke="#d69c86" strokeWidth="2" /></>;
      break;
    case "rotation":
      diagram = <><circle cx="180" cy="90" r="52" fill="none" stroke="var(--accent)" strokeWidth="9" /><circle cx="180" cy="90" r="9" fill="currentColor" /><circle cx="180" cy="38" r="8" fill="#91b9d8" /><circle cx="232" cy="90" r="8" fill="#d69c86" /><path d="M160 35a61 61 0 0 1 64 18" fill="none" stroke="currentColor" strokeWidth="3" /><path d="m222 44 3 12-12-2" fill="currentColor" /></>;
      break;
    default:
      diagram = <circle cx="180" cy="90" r="24" fill="var(--accent)" />;
  }

  return <div className="concept-static-model" role="img" aria-label={`${config.model}: ${config.notice}`}>
    <svg viewBox="0 0 360 180" aria-hidden="true">
      {diagram}
      <text x="180" y="165" textAnchor="middle" fill="currentColor">{config.model.replaceAll("-", " ")}</text>
    </svg>
    <p>Interactive 3D is unavailable on this device. This labeled diagram shows the main model for {config.model.replaceAll("-", " ")}.</p>
  </div>;
}

function isLowEndDevice() {
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = navigator.deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

export default function Topic3DConceptSimulation({ topic }) {
  const config = getConceptSimulationConfig(topic);
  const [playing, setPlaying] = useState(() => !reducedMotionPreference());
  const [visible, setVisible] = useState(false);
  const [angle, setAngle] = useState(0);
  const [progress, setProgress] = useState(initialParameter);
  const [lowEnd, setLowEnd] = useState(false);
  const colors = useThemeColors();
  const rootRef = useRef(null);

  useEffect(() => {
    setLowEnd(isLowEndDevice());
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!config) return <p role="status">No 3D model is configured for this topic yet.</p>;
  const staticView = lowEnd;

  function reset() {
    setAngle(0);
    setProgress(initialParameter);
    setPlaying(false);
  }

  return <div ref={rootRef} className="concept-simulation">
    <div className="concept-simulation-controls">
      <label>{config.label}<input type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /><span>{progress}%</span></label>
      <label>View angle<input type="range" min="0" max="360" value={angle} onChange={(event) => setAngle(Number(event.target.value))} /><span>{angle}°</span></label>
      <div className="concept-simulation-actions">
        <button className="btn outline" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button>
        <button className="btn soft" type="button" onClick={reset}>Reset</button>
      </div>
    </div>
    {staticView ? <StaticModel config={config} /> : <div className="concept-canvas" role="img" aria-label={`Interactive 3D model: ${topic.title}`}>
      <Canvas
        camera={{ position: [0, 0, 4.7], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop={playing && visible ? "always" : "demand"}
        fallback={<StaticModel config={config} />}
      >
        <color attach="background" args={[colors.canvas]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, 2]} intensity={0.5} />
        <group rotation={[0.12, (angle / 180) * Math.PI, 0]}>
          <Model model={config.model} progress={progress} colors={colors} />
        </group>
      </Canvas>
    </div>}
    <p className="sim-notice"><strong>What to notice:</strong> {config.notice}</p>
    {staticView && <p className="concept-device-note">Using a low-resource view to keep this topic smooth on your device.</p>}
  </div>;
}
