import { getSimulationForTopic } from "./simulations/simulationRegistry.js";
import "./Topic3DViewer.css";

export default function Topic3DViewer({ topic }) {
  const Simulation = getSimulationForTopic(topic);

  if (!Simulation) {
    return (
      <section className="shm-viewer">
        <header className="shm-viewer-heading">
          <div>
            <span className="shm-eyebrow">TOPIC VISUALISATION</span>
            <h2>{topic.title}</h2>
          </div>
        </header>
        <p className="shm-unavailable">
          A 3D simulation is not available for this topic yet. Use the lesson
          and revision sections for its current learning content.
        </p>
      </section>
    );
  }

  return (
    <section className="shm-viewer">
      <header className="shm-viewer-heading">
        <div>
          <span className="shm-eyebrow">{topic.id === "class-11-physics-simple-harmonic-motion" ? "EXPLORE THE MOTION" : "INTERACTIVE 3D EXPLANATION"}</span>
          <h2>{topic.title}</h2>
        </div>
      </header>
      <Simulation topic={topic} />
    </section>
  );
}
