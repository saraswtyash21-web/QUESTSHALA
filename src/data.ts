import type { Board, BuddyId } from "./types";
import curriculumJson from "./curriculum.json";

export const curriculum = curriculumJson as Record<string, Record<string, string[]>>;

export const boards: { id: Board; detail: string }[] = [
  { id: "CBSE", detail: "Central Board of Secondary Education" },
  { id: "CISCE (ICSE / ISC)", detail: "Council for the Indian School Certificate Examinations" },
  { id: "Haryana Board (HBSE)", detail: "Board of School Education Haryana" },
  { id: "NIOS", detail: "National Institute of Open Schooling" },
  { id: "Other State Board", detail: "Select your state board curriculum track" },
];

export const exams = [
  "JEE Main",
  "JEE Advanced",
  "NEET-UG",
  "CUET-UG",
  "NDA",
  "BITSAT",
  "VITEEE",
  "CLAT",
  "NATA",
  "UPSC Civil Services",
  "SSC CGL / CHSL / MTS",
  "COMEDK UGET",
  "State CETs",
  "AILET",
  "CAT",
  "GATE",
  "CTET",
  "UGC NET",
];

export const officialSources = [
  { label: "CBSE curriculum 2026–27", url: "https://cbseacademic.nic.in/curriculum_2027.html" },
  { label: "JEE Main 2026 syllabus", url: "https://jeemain.nta.nic.in/document/syllabus-2026/" },
  { label: "NEET UG 2026 syllabus", url: "https://neet.nta.nic.in/document/syllabus-for-neet-ug-2026-examination/" },
  { label: "CUET UG 2026 syllabus", url: "https://cuet.nta.nic.in/cuetug-2026-syllabus/" },
  { label: "UPSC NDA/NA Examination II 2026", url: "https://www.upsc.gov.in/examinations/National%20Defence%20Academy%20and%20Naval%20Academy%20Examination%20%28II%29%2C%202026" },
  { label: "SSC CGL 2026 notice", url: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf" },
];

export const buddies: { id: BuddyId; label: string; style: string; greeting?: string; specialties?: string[] }[] = [
  {
    id: "beerus",
    label: "Beerus",
    style: "friendly, supportive, and step-by-step",
    greeting: "Hi, I’m Beerus. We can work through one idea at a time.",
    specialties: ["Everyday questions", "Learning support", "Step-by-step hints"],
  },
  { id: "panda", label: "Panda Professor", style: "patient and encouraging" },
  { id: "fox", label: "Fox Explorer", style: "curious and adventurous" },
  { id: "robot", label: "Robot Genius", style: "logical and precise" },
  { id: "owl", label: "Owl Mentor", style: "thoughtful and wise" },
  { id: "dino", label: "Dino Scientist", style: "playful and full of questions" },
  { id: "cat", label: "Cat Companion", style: "calm and kind" },
];

export interface TopicContent {
  id: string;
  title: string;
  subject: string;
  grades: number[];
  intro: string;
  steps: string[];
  example: string;
  questions: { prompt: string; choices: string[]; answer: number; explanation: string }[];
  cards: { front: string; back: string }[];
}

type RawQuestion = [string, string[], number, string];

const plantQuestions: RawQuestion[] = [
  ["Which part of most seeds grows into the first root?", ["Radicle", "Petal", "Fruit", "Pollen"], 0, "The radicle is the embryonic root and is usually the first part to emerge."],
  ["What is germination?", ["A seed beginning to grow", "A flower making nectar", "A leaf falling", "A plant absorbing soil"], 0, "Germination is the start of growth from a seed."],
  ["Which condition is generally needed to start germination?", ["Water", "Bright light only", "Fertilizer only", "A large pot"], 0, "Water activates processes inside many seeds; exact needs vary by species."],
  ["What does a young shoot usually grow toward?", ["Light", "The centre of a stone", "Salt", "Darkness only"], 0, "Shoots commonly grow toward light, helping leaves photosynthesise."],
  ["Which structure absorbs much of a plant's water from soil?", ["Roots", "Petals", "Fruit", "Seeds"], 0, "Roots take up water and mineral nutrients from the soil."],
  ["What is the main role of leaves?", ["Make sugars using light", "Anchor the plant", "Absorb pollen", "Protect every seed"], 0, "Leaves use light energy in photosynthesis to make sugars."],
  ["What gas do plants take in for photosynthesis?", ["Carbon dioxide", "Helium", "Hydrogen", "Neon"], 0, "Plants use carbon dioxide, water and light to make sugars."],
  ["What may a flowering plant produce after pollination and fertilisation?", ["Seeds", "Roots only", "More soil", "Sunlight"], 0, "After fertilisation, ovules develop into seeds; in many flowering plants the ovary develops into fruit."],
  ["Why does a seed contain stored food?", ["To support early growth", "To attract rain clouds", "To make soil", "To replace sunlight forever"], 0, "Stored food can support the embryo before it has leaves."],
  ["Which is a fair test of how water affects seed germination?", ["Keep two groups alike except for water", "Use different seeds and soils in every group", "Change water and light together", "Observe only one seed once"], 0, "Changing one factor at a time helps identify its effect."],
];

const colorQuestions: RawQuestion[] = [
  ["In a basic paint-mixing model, which pair makes green?", ["Blue and yellow", "Red and blue", "Red and yellow", "Black and white"], 0, "Mixing blue and yellow pigments usually produces green."],
  ["Which is a primary colour in the traditional RYB paint model?", ["Red", "Green", "Orange", "Purple"], 0, "Red, yellow and blue are the traditional primary paint colours."],
  ["What colour is made by mixing red and yellow paint?", ["Orange", "Green", "Violet", "Blue"], 0, "Red and yellow pigments combine to make orange."],
  ["What colour is made by mixing red and blue paint?", ["Violet", "Green", "Yellow", "Orange"], 0, "Red and blue pigments combine to make violet or purple."],
  ["What happens when more white paint is mixed into a colour?", ["It becomes lighter", "It becomes darker", "It becomes transparent", "It turns black"], 0, "White paint lightens a colour, creating a tint."],
  ["What is a shade in painting?", ["A colour mixed with black", "A colour mixed with water only", "A primary colour", "A reflected shadow only"], 0, "Adding black makes a darker shade."],
  ["Which pair are complementary on a simple colour wheel?", ["Blue and orange", "Blue and green", "Yellow and orange", "Red and orange"], 0, "Blue and orange sit opposite each other on a common colour wheel."],
  ["Why can colours look different under coloured light?", ["The light reaching the object changes", "The object changes its material", "All pigments disappear", "Shadows stop forming"], 0, "The light available to reflect from an object affects the colours we see."],
  ["Which tool helps an artist test a small paint mixture?", ["A palette", "A ruler", "A compass", "A thermometer"], 0, "A palette is used to hold and mix small amounts of paint."],
  ["What should you do when a colour mixture is too dark?", ["Add a little lighter paint and test again", "Add more black", "Stop observing", "Add dry soil"], 0, "Small additions and retesting help control the resulting tint."],
];

const patternQuestions: RawQuestion[] = [
  ["What comes next: 2, 4, 6, 8, ...?", ["10", "9", "12", "16"], 0, "The rule is add 2 each time, so 8 + 2 = 10."],
  ["What is the rule in 5, 10, 15, 20?", ["Add 5", "Add 10", "Multiply by 5", "Subtract 5"], 0, "Each number increases by 5."],
  ["What comes next: 3, 6, 12, 24, ...?", ["48", "36", "27", "30"], 0, "Each term doubles, so 24 × 2 = 48."],
  ["Which number is missing: 1, 4, 7, __, 13?", ["10", "9", "11", "12"], 0, "Add 3 each time: 7 + 3 = 10."],
  ["What is the next square number after 1, 4, 9?", ["16", "12", "15", "18"], 0, "These are 1², 2², 3²; the next is 4² = 16."],
  ["A pattern repeats red, blue, blue. What is the 4th colour?", ["Red", "Blue", "Green", "Yellow"], 0, "The three-colour block starts again at position four."],
  ["What is the rule in 20, 17, 14, 11?", ["Subtract 3", "Add 3", "Subtract 2", "Divide by 3"], 0, "Each term decreases by 3."],
  ["Which expression gives the nth term of 2, 4, 6, 8, ...?", ["2n", "n + 2", "n²", "2 + n"], 0, "The nth even number in this sequence is 2 multiplied by n."],
  ["How can you check a number pattern rule?", ["Apply it to more than one step", "Guess from the last term only", "Ignore the differences", "Change the sequence"], 0, "A valid rule should explain each transition, not just one."],
  ["What comes next: 1, 1, 2, 3, 5, 8, ...?", ["13", "11", "14", "16"], 0, "Each term is the sum of the two before it: 5 + 8 = 13."],
];

function buildQuestions(raw: RawQuestion[]) {
  return raw.map(([prompt, sourceChoices, sourceAnswer, explanation], index) => {
    const choices = [...sourceChoices];
    const answer = (index + 1) % choices.length;
    [choices[sourceAnswer], choices[answer]] = [choices[answer], choices[sourceAnswer]];
    return { prompt, choices, answer, explanation };
  });
}

export const topicBank: TopicContent[] = [
  {
    id: "plant-growth",
    title: "How plants grow",
    subject: "Science",
    grades: [3, 4, 5],
    intro: "A plant's life often begins inside a seed. When conditions are suitable, the embryo starts growing and develops into a seedling.",
    steps: ["A seed takes in water and begins germination.", "The first root grows down to take up water and hold the plant.", "A shoot grows upward; leaves begin making food using light.", "As the plant matures, it may flower and produce seeds."],
    example: "Place two similar bean seeds on damp cotton. Keep one warm and one cool, and observe them daily. The comparison helps show how warmth affects germination.",
    questions: buildQuestions(plantQuestions),
    cards: [
      { front: "What is germination?", back: "The process in which a seed begins to grow into a seedling." },
      { front: "What does a root do?", back: "It anchors the plant and absorbs water and mineral nutrients." },
      { front: "What do leaves make during photosynthesis?", back: "Sugars, using light energy, water and carbon dioxide." },
    ],
  },
  {
    id: "color-mixing",
    title: "The magic of colours",
    subject: "Science",
    grades: [1, 2, 3, 4, 5],
    intro: "Paint colours can combine to make new colours. This activity uses the traditional red-yellow-blue pigment model; light behaves differently.",
    steps: ["Start with small amounts of two paints.", "Mix them on a palette and notice the change.", "Try changing the amount of one colour to make a different-looking mixture.", "Record your results so you can compare them."],
    example: "Mix a little yellow paint into blue. The mixture usually looks green. Add more yellow and it may appear lighter or warmer.",
    questions: buildQuestions(colorQuestions),
    cards: [
      { front: "Which paints mix to make green in the RYB model?", back: "Blue and yellow." },
      { front: "What is a tint?", back: "A colour made lighter by adding white." },
      { front: "Why test paint in small amounts?", back: "Small amounts are easier to adjust and compare." },
    ],
  },
  {
    id: "number-patterns",
    title: "Numbers & patterns",
    subject: "Mathematics",
    grades: [2, 3, 4, 5],
    intro: "A number pattern is a list that follows a rule. Find what changes between terms, then use the rule to predict what comes next.",
    steps: ["Compare neighbouring numbers.", "Check whether the same amount is added, subtracted, multiplied or divided.", "Test your rule on every pair.", "Use the rule to find a missing or next term."],
    example: "In 4, 7, 10, 13, each term increases by 3. The next term is 16.",
    questions: buildQuestions(patternQuestions),
    cards: [
      { front: "What is a term in a sequence?", back: "One of the numbers or objects in the sequence." },
      { front: "How do you check a pattern rule?", back: "Apply it to every step and confirm it explains all the terms." },
      { front: "What is the next term in 4, 7, 10, 13?", back: "16; add 3 each time." },
    ],
  },
  {
    id: "class-11-physics-simple-harmonic-motion",
    title: "Simple Harmonic Motion",
    subject: "Physics",
    grades: [11],
    intro: "Simple Harmonic Motion (SHM) is repeated back-and-forth motion around an equilibrium position. A restoring force or torque acts toward that position.",
    steps: [
      "Find the equilibrium position, where the system would rest.",
      "Amplitude is the greatest displacement from equilibrium.",
      "A spring-mass system has period T = 2π√(m/k).",
      "A simple pendulum at a small angle has period T = 2π√(L/g).",
      "Frequency is the number of oscillations per second: f = 1/T.",
    ],
    example: "If a 1 kg mass is attached to a spring with k = 4 N/m, its period is 2π√(1/4) = π seconds, and its frequency is about 0.32 Hz.",
    questions: buildQuestions([
      ["What does amplitude measure?", ["Maximum displacement from equilibrium", "Distance travelled in one second", "Mass of the oscillator", "Force at equilibrium"], 0, "Amplitude is the greatest displacement from the equilibrium position."],
      ["If a spring-mass system's mass increases while its spring stays the same, what happens to its period?", ["It increases", "It decreases", "It becomes zero", "It does not change"], 0, "T = 2π√(m/k), so increasing mass makes the period longer."],
      ["How are frequency and period related?", ["f = 1/T", "f = T²", "f = T + 1", "f = 2T"], 0, "Frequency is the reciprocal of the time taken for one complete oscillation."],
    ]),
    cards: [
      { front: "What is a restoring force?", back: "A force that acts to return an object toward its equilibrium position." },
      { front: "Spring-mass period", back: "T = 2π√(m/k), for an ideal spring-mass system." },
      { front: "Simple pendulum period", back: "T = 2π√(L/g), when the pendulum swings at a small angle." },
    ],
  },
  {
    id: "mixed-revision",
    title: "Mixed revision challenge",
    subject: "General aptitude",
    grades: [9, 10, 11, 12],
    intro: "A short, mixed-revision practice set assembled from the question sample supplied for this project. It combines spelling, ratio, speed, science, vocabulary, arithmetic and civics; it is not an official exam mock.",
    steps: [
      "Read the whole question and identify the topic it checks.",
      "Try a method before looking at the options.",
      "Use the explanation to review the step you missed.",
      "Revisit the relevant school lesson before another attempt.",
    ],
    example: "For a ratio of 2:3 with a total of 25, first count the five total parts. Each part is 25 ÷ 5 = 5, so the smaller share is 2 × 5 = 10.",
    questions: buildQuestions([
      ["Choose the correct spelling.", ["Privilege", "Privilage", "Priviledge", "Privelege"], 0, "Privilege is the correct spelling."],
      ["If the ratio is 2:3 and the total is 25, the smaller share is…", ["5", "15", "10", "20"], 2, "There are 5 ratio parts; 2/5 × 25 = 10."],
      ["A train 120 m long passes a pole in 6 seconds. Its speed is…", ["20 m/s", "12 m/s", "60 m/s", "720 m/s"], 0, "Speed = distance ÷ time = 120 ÷ 6 = 20 m/s."],
      ["Which is the largest planet in the Solar System?", ["Venus", "Mars", "Earth", "Jupiter"], 3, "Jupiter is the largest planet in the Solar System."],
      ["Choose the antonym of 'expand'.", ["Enlarge", "Extend", "Increase", "Contract"], 3, "Contract means become smaller or draw together."],
      ["If 3/5 of a number is 30, the number is…", ["50", "35", "45", "18"], 0, "Number = 30 × 5 ÷ 3 = 50."],
      ["The Constitution of India came into effect on…", ["26 January 1950", "26 November 1949", "2 October 1950", "15 August 1947"], 0, "India's Constitution came into effect on 26 January 1950."],
    ]),
    cards: [
      { front: "What is the smaller share in a 2:3 ratio totalling 25?", back: "10. There are five parts, each worth 5; the smaller share is two parts." },
      { front: "How do you calculate speed?", back: "Speed = distance ÷ time. For 120 m in 6 s, the speed is 20 m/s." },
      { front: "When did the Constitution of India come into effect?", back: "26 January 1950." },
    ],
  },
];

export const getTopicsForGrade = (grade: number) =>
  topicBank.filter((topic) => topic.grades.includes(grade));

/** Topic clusters transcribed from the supplied LearnQuest AI Syllabus Compendium 2026–27.
 * These are routing maps, not a replacement for the current official exam notification. */
export const examTopicMaps: { name: string; subjects: { name: string; topics: string[] }[]; officialUrl: string; note: string }[] = [
  { name: "JEE Main", officialUrl: "https://jeemain.nta.nic.in/document/syllabus-2026/", note: "Paper options, exclusions and exact unit wording must be verified against the annual NTA bulletin.", subjects: [
    { name: "Physics", topics: ["Units and measurements", "Kinematics", "Laws of motion", "Work, energy and power", "Rotational motion", "Gravitation", "Properties of solids and liquids", "Thermodynamics and kinetic theory", "Oscillations and waves", "Electrostatics and current electricity", "Magnetic effects and magnetism", "EMI and alternating current", "Electromagnetic waves", "Optics", "Dual nature, atoms and nuclei", "Electronic devices", "Experimental skills"] },
    { name: "Chemistry", topics: ["Mole concept and basic concepts", "Atomic structure", "Chemical bonding", "Thermodynamics", "Solutions and equilibrium", "Redox and electrochemistry", "Chemical kinetics", "Periodicity and p-block", "d- and f-block", "Coordination compounds", "Organic purification and characterisation", "Organic fundamentals and hydrocarbons", "Halo compounds", "Oxygen- and nitrogen-containing compounds", "Biomolecules and practical chemistry"] },
    { name: "Mathematics", topics: ["Sets, relations and functions", "Complex numbers and quadratic equations", "Matrices and determinants", "Permutations and combinations", "Binomial theorem", "Sequences and series", "Limits, continuity and differentiability", "Integral calculus and differential equations", "Lines, circles and conics", "3D geometry and vectors", "Statistics and probability", "Trigonometry"] },
  ] },
  { name: "JEE Advanced", officialUrl: "https://jeeadv.ac.in/documents/jee-advanced-2026-syllabus.pdf", note: "Two compulsory papers; detailed equations, exclusions and question formats follow the official syllabus and information brochure.", subjects: [
    { name: "Physics", topics: ["Mechanics", "Thermal physics", "Electricity and magnetism", "Electromagnetic waves", "Optics", "Modern physics", "Measurement and experimental / physical reasoning"] },
    { name: "Chemistry", topics: ["General chemistry and stoichiometry", "States of matter", "Atomic structure", "Chemical bonding and molecular structure", "Thermodynamics and equilibrium", "Electrochemistry and redox", "Chemical kinetics", "Solutions and surface-related topics where prescribed", "Periodicity and inorganic chemistry", "Coordination chemistry", "Organic structure, mechanisms and functional groups", "Practical / qualitative chemistry"] },
    { name: "Mathematics", topics: ["Sets, relations and functions", "Algebra and complex numbers", "Matrices and determinants", "Permutations, combinations and binomial theorem", "Sequences and series", "Trigonometry", "Coordinate geometry", "Vectors and 3D geometry", "Limits, continuity and differentiability", "Integral calculus and differential equations", "Probability and statistics"] },
  ] },
  { name: "NEET-UG", officialUrl: "https://neet.nta.nic.in/document/syllabus-for-neet-ug-2026-examination/", note: "Use the current NTA syllabus and bulletin; do not reuse past-year removed-topic lists without verification.", subjects: [
    { name: "Physics", topics: ["Physics and measurement", "Kinematics and laws of motion", "Work, energy and power", "Rotational motion and gravitation", "Properties of solids and liquids", "Thermodynamics and kinetic theory", "Oscillations and waves", "Electrostatics and current electricity", "Magnetic effects and magnetism", "EMI and AC", "Electromagnetic waves and optics", "Dual nature, atoms and nuclei", "Electronic devices", "Experimental skills"] },
    { name: "Chemistry", topics: ["Basic concepts and mole calculations", "Atomic structure and periodicity", "Chemical bonding", "Thermodynamics and solutions", "Equilibrium", "Redox and electrochemistry", "Chemical kinetics", "Inorganic elements and coordination compounds", "Purification and characterisation", "Organic principles and hydrocarbons", "Halo compounds", "Oxygen- and nitrogen-containing compounds", "Biomolecules", "Practical chemistry"] },
    { name: "Biology", topics: ["Diversity of the living world", "Biological classification", "Plant and animal structural organisation", "Cell structure and function", "Plant physiology", "Human physiology", "Reproduction", "Genetics and evolution", "Biology and human welfare", "Biotechnology and applications", "Ecology and environment"] },
  ] },
  { name: "CUET-UG", officialUrl: "https://cuet.nta.nic.in/cuetug-2026-syllabus/", note: "Subject requirements vary by university and programme. Choose the subject-code PDF for each selected paper.", subjects: [
    { name: "Language papers", topics: ["Reading comprehension", "Vocabulary", "Verbal ability", "Grammar and language usage", "Literary / functional reading where applicable"] },
    { name: "Domain subjects", topics: ["Accountancy / Book-Keeping", "Agriculture", "Anthropology", "Biology / Biotechnology / Biochemistry", "Business Studies", "Chemistry", "Environmental Science", "Computer Science / Informatics Practices", "Economics", "Geography / Geology", "History", "Mathematics / Applied Mathematics", "Physics", "Political Science", "Psychology", "Sociology and other listed domains"] },
    { name: "General Aptitude Test", topics: ["General knowledge and current affairs", "General mental ability", "Numerical ability", "Quantitative reasoning", "Logical and analytical reasoning", "Basic mathematical applications", "Problem-solving"] },
  ] },
  { name: "NDA / Naval Academy", officialUrl: "https://www.upsc.gov.in/examinations", note: "Check the current UPSC notification for paper structure, eligibility and subject details.", subjects: [
    { name: "Mathematics", topics: ["Algebra", "Matrices and determinants", "Trigonometry", "Analytical geometry", "Differential and integral calculus", "Differential equations", "Vector algebra", "Statistics and probability"] },
    { name: "General Ability Test", topics: ["English grammar and comprehension", "Physics", "Chemistry", "General science", "History and freedom movement", "Geography", "Current events"] },
  ] },
  { name: "UPSC Civil Services", officialUrl: "https://upsc.gov.in/examinations", note: "Preliminary topic clusters below are not a substitute for the current UPSC notification or detailed syllabus.", subjects: [
    { name: "Prelims — General Studies I", topics: ["Current events of national and international importance", "Indian history and national movement", "Indian and world geography", "Polity and governance", "Constitution and political system", "Local government and public policy", "Economic and social development", "Environment, biodiversity and climate", "General science"] },
    { name: "CSAT", topics: ["Comprehension", "Interpersonal and communication skills", "Logical reasoning and analytical ability", "Decision-making and problem-solving", "General mental ability", "Basic numeracy", "Data interpretation"] },
  ] },
  { name: "SSC CGL / CHSL / MTS", officialUrl: "https://ssc.gov.in/", note: "Exam tiers and weighting vary by notification; confirm the current official notice.", subjects: [
    { name: "Quantitative aptitude", topics: ["Number systems", "Arithmetic", "Percentages and ratio", "Profit, loss and interest", "Algebra", "Geometry and mensuration", "Trigonometry", "Statistics and data interpretation"] },
    { name: "Reasoning", topics: ["Analogies and classification", "Series", "Coding-decoding", "Spatial reasoning", "Syllogisms", "Logical analysis", "Problem-solving"] },
    { name: "English", topics: ["Vocabulary", "Grammar", "Sentence structure", "Comprehension", "Error detection", "Cloze tests"] },
    { name: "General awareness", topics: ["Current affairs", "History", "Geography", "Polity", "Economics", "General science"] },
  ] },
  { name: "BITSAT / VITEEE / COMEDK / State CETs", officialUrl: "https://www.bitsadmission.com/", note: "This is a shared planning map only. Each exam has its own brochure, weightage and exact scope.", subjects: [
    { name: "Physics", topics: ["Mechanics", "Thermal physics", "Electricity and magnetism", "Waves and optics", "Modern physics"] },
    { name: "Chemistry", topics: ["Physical chemistry", "Inorganic chemistry", "Organic chemistry", "Practical chemistry where prescribed"] },
    { name: "Mathematics / Biology", topics: ["Algebra and calculus", "Coordinate geometry", "Vectors and probability", "Biology: diversity, cell biology, physiology, genetics, biotechnology and ecology where relevant"] },
    { name: "Aptitude / English", topics: ["Logical reasoning", "Spatial and analytical reasoning", "English usage and comprehension where included"] },
  ] },
  { name: "CLAT / AILET", officialUrl: "https://consortiumofnlus.ac.in/", note: "Question types and section details must be checked against the current admission test notification.", subjects: [
    { name: "Core areas", topics: ["English language and comprehension", "Current affairs and general knowledge", "Legal reasoning", "Logical reasoning", "Quantitative techniques"] },
  ] },
  { name: "NATA", officialUrl: "https://www.nata.in/", note: "Check the current Council of Architecture / NATA brochure for aptitude and drawing assessment details.", subjects: [
    { name: "Architecture aptitude", topics: ["Visualisation and spatial ability", "Observation and analytical thinking", "Elements of design", "Architectural awareness", "Geometry and proportion", "Drawing and composition"] },
  ] },
  { name: "CAT", officialUrl: "https://iimcat.ac.in/", note: "Section structure and time limits follow the current CAT notification.", subjects: [
    { name: "Verbal Ability & Reading Comprehension", topics: ["Reading comprehension", "Para-jumbles", "Para-summary", "Sentence placement and verbal reasoning"] },
    { name: "Data Interpretation & Logical Reasoning", topics: ["Tables and charts", "Caselets", "Arrangements", "Games and tournaments", "Networks and grouping", "Logical sets"] },
    { name: "Quantitative Aptitude", topics: ["Arithmetic", "Algebra", "Geometry and mensuration", "Number systems", "Modern mathematics"] },
  ] },
  { name: "GATE", officialUrl: "https://gate2027.iitr.ac.in/", note: "Paper-specific syllabus and general aptitude are authoritative; this is a high-level routing map.", subjects: [
    { name: "General Aptitude", topics: ["Verbal aptitude", "Quantitative aptitude", "Analytical aptitude", "Spatial aptitude"] },
    { name: "Engineering / subject paper", topics: ["Engineering mathematics where prescribed", "Core discipline concepts", "Problem solving and application", "Paper-specific topics from the official syllabus"] },
  ] },
  { name: "CTET", officialUrl: "https://ctet.nic.in/", note: "Paper I / II and subject choices depend on the teaching level; use the current information bulletin.", subjects: [
    { name: "Paper I / Paper II", topics: ["Child development and pedagogy", "Language I", "Language II", "Mathematics and science for relevant paper", "Environmental studies for Paper I", "Social studies / social science for relevant Paper II"] },
  ] },
  { name: "UGC NET", officialUrl: "https://ugcnet.nta.ac.in/", note: "Choose the exact subject and check the current NTA syllabus PDF.", subjects: [
    { name: "Paper I", topics: ["Teaching aptitude", "Research aptitude", "Comprehension", "Communication", "Mathematical reasoning", "Logical reasoning", "Data interpretation", "ICT", "People and environment", "Higher education system"] },
    { name: "Paper II", topics: ["Subject-specific syllabus selected by the candidate; official subject PDF controls exact units"] },
  ] },
];
