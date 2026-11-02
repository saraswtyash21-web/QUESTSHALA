import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TopicSimulation({ topic }) {
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [growth, setGrowth] = useState(1);
  const [water, setWater] = useState(true);
  const [light, setLight] = useState(true);
  const [first, setFirst] = useState("red");
  const [second, setSecond] = useState("yellow");
  const [step, setStep] = useState(2);
  const [term, setTerm] = useState(1);
  const [visible, setVisible] = useState(true);
  const simulationRef = useRef(null);
  const plant = topic.id === "plant-growth";
  const color = topic.id === "color-mixing";
  const mixture = [first, second].sort().join("-");
  const result = first === second ? first : ({ "blue-yellow": "green", "blue-red": "violet", "red-yellow": "orange" })[mixture] ?? "a new colour";

  useEffect(() => {
    const node = simulationRef.current;
    if (!node || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || !visible) return undefined;
    const timer = window.setInterval(() => {
      if (plant) {
        if (water) setGrowth((value) => Math.min(5, value + 1));
      } else if (!color) setTerm((value) => value + step);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [color, plant, playing, step, visible, water]);

  function reset() {
    setGrowth(1);
    setTerm(1);
    setPlaying(false);
  }

  return (
    <div ref={simulationRef} className="topic-simulation" aria-label={`${topic.title} interactive simulation`}>
      <div className="topic-simulation-controls">
        {plant && <>
          <label>Growth stage <input type="range" min="1" max="5" value={growth} onChange={(event) => setGrowth(Number(event.target.value))} /></label>
          <label className="sim-toggle"><input type="checkbox" checked={water} onChange={(event) => setWater(event.target.checked)} /> Water</label>
          <label className="sim-toggle"><input type="checkbox" checked={light} onChange={(event) => setLight(event.target.checked)} /> Light</label>
        </>}
        {color && <>
          <label>First paint <select value={first} onChange={(event) => setFirst(event.target.value)}><option value="red">Red</option><option value="yellow">Yellow</option><option value="blue">Blue</option></select></label>
          <label>Second paint <select value={second} onChange={(event) => setSecond(event.target.value)}><option value="red">Red</option><option value="yellow">Yellow</option><option value="blue">Blue</option></select></label>
        </>}
        {!plant && !color && <label>Step size <input type="range" min="1" max="5" value={step} onChange={(event) => setStep(Number(event.target.value))} /><strong>+{step}</strong></label>}
        <div className="sim-actions"><button className="btn outline" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button><button className="btn soft" type="button" onClick={reset}>Reset</button></div>
      </div>
      <div className="topic-simulation-visual" aria-live="polite">
        {plant && <svg viewBox="0 0 360 190" role="img" aria-label={`Seedling at growth stage ${growth}, ${water ? "watered" : "without water"}, ${light ? "with light" : "without light"}`}>
          <path d="M25 151 H335" stroke="currentColor" strokeWidth="4" />
          <ellipse cx="180" cy="152" rx="60" ry="15" fill="#94613f" />
          <path d={`M180 144 V${136 - growth * 17}`} stroke="#3b8f58" strokeWidth="7" strokeLinecap="round" />
          {growth > 1 && <><path d={`M180 ${126 - growth * 14} Q${130 - growth * 4} ${120 - growth * 13} ${139 - growth * 2} ${108 - growth * 12} Q${160 - growth * 2} ${108 - growth * 13} 180 ${126 - growth * 14}`} fill="#5caf6d" stroke="#286c43" strokeWidth="2" /><path d={`M180 ${118 - growth * 14} Q${210 + growth * 3} ${100 - growth * 14} ${230 + growth * 2} ${94 - growth * 13} Q${202 + growth * 2} ${86 - growth * 14} 180 ${118 - growth * 14}`} fill="#78c879" stroke="#286c43" strokeWidth="2" /></>}
          <ellipse cx="180" cy="148" rx="13" ry="7" fill="#d3a15e" />
          {light && <circle cx="300" cy="38" r="20" fill="#f3c64e" />}
          {!water && <text x="180" y="28" textAnchor="middle" fill="currentColor">Add water to support germination</text>}
        </svg>}
        {color && <div className="mixing-visual"><span className={`paint-swatch ${first}`}>{first}</span><span className="mix-plus">+</span><span className={`paint-swatch ${second}`}>{second}</span><span className="mix-equals">=</span><span className={`paint-swatch ${result}`}>{result}</span></div>}
        {!plant && !color && <div className="number-sequence"><span>{[0, 1, 2, 3].map((offset) => term + step * offset).join("  ·  ")}</span><small>Current rule: add {step} each time</small></div>}
      </div>
      <p className="sim-notice"><strong>What to notice:</strong> {plant ? "Water helps many seeds begin germination; light helps the shoot grow after it emerges." : color ? "In the traditional paint model, combining two primary pigments makes a secondary colour." : "Check that the same step size explains each jump in the sequence."}</p>
      {!plant && !color && <p className="sim-formula">aₙ = first term + (n − 1) × step</p>}
      <Link className="text-link" to={`/practice?topic=${topic.id}`}>Try a related practice quiz →</Link>
    </div>
  );
}
