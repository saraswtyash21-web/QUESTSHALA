import { lazy } from "react";

const SimpleHarmonicMotionSimulation = lazy(() =>
  import("./SimpleHarmonicMotionSimulation.jsx"),
);
const TopicSimulation = lazy(() => import("../TopicSimulation.jsx"));
const Topic3DConceptSimulation = lazy(() => import("./Topic3DConceptSimulation.jsx"));

export const TOPIC_3D_CONCEPTS = [
  {
    model: "atom",
    subjects: ["Chemistry", "Science"],
    titles: ["Atoms, molecules and chemical change", "Mole concept and atomic structure"],
    notice: "This simplified Bohr-style model shows a compact nucleus and electrons in energy levels. Real electrons do not travel in fixed circular tracks.",
    label: "Energy level",
  },
  {
    model: "bonding",
    subjects: ["Chemistry"],
    titles: ["Periodicity and chemical bonding", "Coordination compounds"],
    notice: "Compare atoms connected in a simple molecule. The model shows relative connectivity, not exact bond angles or electron density.",
    label: "Bond length",
  },
  {
    model: "particles",
    subjects: ["Chemistry", "Science"],
    titles: ["States of matter where prescribed", "Materials and their properties"],
    notice: "Particles are packed closely in a solid, less regularly in a liquid, and farther apart in a gas. The particle sizes are not to scale.",
    label: "Particle spacing",
  },
  {
    model: "reaction",
    subjects: ["Chemistry", "Science"],
    titles: ["Chemical reactions and equations", "Separation and changes"],
    notice: "A reaction rearranges atoms into new groupings. Atoms are conserved; this illustration is a model, not a balanced reaction equation.",
    label: "Reaction progress",
  },
  {
    model: "carbon",
    subjects: ["Chemistry"],
    titles: ["Carbon compounds", "Organic chemistry principles and hydrocarbons"],
    notice: "Carbon can form four covalent bonds. This tetrahedral methane model shows one common arrangement; bond lengths are illustrative.",
    label: "View angle",
  },
  {
    model: "cell",
    subjects: ["Biology", "Science"],
    titles: ["Cells and microorganisms", "Cell structure and function", "Living organisms and classification"],
    notice: "Explore a simplified animal cell: the membrane encloses cytoplasm, with the nucleus and other organelles inside. Shapes are not to scale.",
    label: "Cell section",
  },
  {
    model: "mitosis",
    subjects: ["Biology"],
    titles: ["Biomolecules and cell division"],
    notice: "The model highlights chromosome separation and the formation of two daughter cells. It simplifies the stages of mitosis.",
    label: "Division stage",
  },
  {
    model: "photosynthesis",
    subjects: ["Biology", "Science", "EVS / World Around Us"],
    titles: ["Plant and human physiology", "Plants, animals, food and nutrition"],
    notice: "Light energy helps leaves use carbon dioxide and water to make sugars, releasing oxygen. The moving particles are a visual guide, not a molecular-scale process.",
    label: "Light level",
  },
  {
    model: "heart",
    subjects: ["Biology", "Science", "EVS / World Around Us"],
    titles: ["Life processes, control and coordination", "Respiration and transport in organisms", "Human body and health", "Body and health"],
    notice: "Follow the route of blood through the four chambers. The right side sends blood to the lungs; the left side sends oxygenated blood to the body.",
    label: "Flow speed",
  },
  {
    model: "food-chain",
    subjects: ["Biology", "Science", "EVS / World Around Us"],
    titles: ["Food chains and living things", "Conservation, pollution and ecosystems", "Organisms, populations, ecosystems and biodiversity"],
    notice: "Energy moves from producers to consumers, while decomposers recycle nutrients. This is one example; real food webs are more connected.",
    label: "Energy flow",
  },
  {
    model: "water-cycle",
    subjects: ["Science", "EVS / World Around Us", "World Around Us"],
    titles: ["Water cycle and conservation", "Water sources, cycle and conservation", "Water conservation, weather and seasons"],
    notice: "Water evaporates, condenses into clouds, and returns as precipitation. It then collects or flows over land before the cycle continues.",
    label: "Cycle stage",
  },
  {
    model: "ecosystem",
    subjects: ["Biology", "Science", "EVS / World Around Us"],
    titles: ["Ecosystems and adaptations", "Environment and physical geography", "Atmosphere, water and life"],
    notice: "Living things interact with one another and with non-living parts of a habitat. The scene is a simplified ecosystem, not a complete food web.",
    label: "Habitat view",
  },
  {
    model: "earth",
    subjects: ["Social Science", "Geography"],
    titles: ["Earth, globes and maps", "Landforms and resources", "Geography, environment, resources and maps"],
    notice: "The cutaway shows a thin crust above the mantle and core. Layer thicknesses and colours are exaggerated to make them visible.",
    label: "Earth rotation",
  },
  {
    model: "force",
    subjects: ["Physics", "Science"],
    titles: ["Force, pressure and friction", "Motion, force and energy", "Kinematics and laws of motion"],
    notice: "Forces are vectors: arrows show direction and relative size. The block moves when the applied force exceeds opposing friction.",
    label: "Applied force",
  },
  {
    model: "circuit",
    subjects: ["Physics", "Science"],
    titles: ["Electricity and chemical effects", "Electricity, magnets, water, air and environment", "Current electricity"],
    notice: "A closed circuit lets current flow from the source through the component and back. The moving markers represent conventional current direction.",
    label: "Current",
  },
  {
    model: "magnet",
    subjects: ["Physics", "Science"],
    titles: ["Magnetic effects and magnetism", "Heat, light, sound, electricity and magnetism", "Light, electricity and magnetic effects"],
    notice: "Field lines outside a bar magnet run from its north pole toward its south pole. The lines show direction, not material threads.",
    label: "Field strength",
  },
  {
    model: "optics",
    subjects: ["Physics", "Science"],
    titles: ["Light, shadows and mirrors", "Ray and wave optics"],
    notice: "The ray changes direction at the boundary between materials because its speed changes. This diagram is qualitative and not to scale.",
    label: "Incident angle",
  },
  {
    model: "sound",
    subjects: ["Physics", "Science"],
    titles: ["Heat, light, sound, electricity and magnetism", "Sound and light"],
    notice: "Sound travels through a medium as pressure variations. The wave shape shows changing pressure, not the path taken by the sound.",
    label: "Frequency",
  },
  {
    model: "dna",
    subjects: ["Biology"],
    titles: ["Reproduction, heredity and evolution themes as prescribed", "Inheritance and molecular basis of inheritance"],
    notice: "DNA has two strands twisted into a double helix. The paired rungs represent complementary bases; the sequence is illustrative.",
    label: "Helix turn",
  },
  {
    model: "rotation",
    subjects: ["Physics"],
    titles: ["System of particles and rotation"],
    notice: "The marked points rotate with the rigid disc around its central axis. This model shows angular motion, not the distribution of mass or moment of inertia.",
    label: "Angular speed",
  },
];

const normalize = (value) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function getConceptSimulationConfig(topic) {
  const topicTitle = normalize(topic.title);
  return TOPIC_3D_CONCEPTS.find((config) =>
    config.subjects.includes(topic.subject) &&
    config.titles.some((title) => normalize(title) === topicTitle),
  ) ?? null;
}

export function hasConceptSimulation(topic) {
  return getConceptSimulationConfig(topic) !== null;
}

const simulations = [
  {
    matches: (topic) =>
      topic.id === "class-11-physics-simple-harmonic-motion" ||
      topic.title.toLowerCase() === "simple harmonic motion",
    component: SimpleHarmonicMotionSimulation,
  },
  { matches: (topic) => ["plant-growth", "color-mixing", "number-patterns"].includes(topic.id), component: TopicSimulation },
  { matches: hasConceptSimulation, component: Topic3DConceptSimulation },
];

export function getSimulationForTopic(topic) {
  return simulations.find((simulation) => simulation.matches(topic))?.component ?? null;
}
