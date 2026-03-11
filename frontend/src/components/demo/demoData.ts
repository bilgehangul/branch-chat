import type { Thread, Message, Annotation, ChildLead, SourceResult } from '../../types/index';

// ---------------------------------------------------------------------------
// Sources for the citation annotation on msg-2 (chlorophyll paragraph)
// ---------------------------------------------------------------------------
const CHLOROPHYLL_SOURCES: SourceResult[] = [
  {
    title: 'Photosynthesis - Khan Academy',
    url: 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants',
    domain: 'khanacademy.org',
    snippet:
      'Chlorophyll absorbs light most strongly in the blue and red portions of the electromagnetic spectrum, reflecting green light which gives plants their characteristic color.',
  },
  {
    title: 'The Role of Chlorophyll in Photosynthesis',
    url: 'https://www.nature.com/scitable/topicpage/photosynthetic-cells-14025371/',
    domain: 'nature.com',
    snippet:
      'Nature Education explains how chlorophyll molecules in the thylakoid membrane capture photons and funnel energy to the reaction centers of photosystems I and II.',
  },
  {
    title: 'Molecular Mechanisms of Photosynthesis',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK22345/',
    domain: 'ncbi.nlm.nih.gov',
    snippet:
      'A comprehensive review of the molecular basis of photosynthesis, from light absorption by antenna pigments to the electron transport chain.',
  },
];

// ---------------------------------------------------------------------------
// Annotations on msg-2
// ---------------------------------------------------------------------------
const CITATION_ANN: Annotation = {
  id: 'ann-citation-1',
  type: 'source',
  targetText: 'chlorophyll',
  paragraphIndex: 1,
  originalText: 'chlorophyll',
  replacementText: null,
  citationNote:
    'Chlorophyll is the primary photosynthetic pigment found in the thylakoid membranes of chloroplasts. It absorbs blue (430 nm) and red (662 nm) light while reflecting green.',
  sources: CHLOROPHYLL_SOURCES,
  isShowingOriginal: false,
};

const SIMPLIFICATION_ANN: Annotation = {
  id: 'ann-simplification-1',
  type: 'simplification',
  targetText: 'electron transport chain',
  paragraphIndex: 3,
  // mode key stored in originalText
  originalText: 'analogy',
  replacementText:
    "Think of the electron transport chain like a water wheel at a mill. Excited electrons flow \"downhill\" through a series of proteins embedded in the thylakoid membrane, just like water flows over a wheel. As they move from one protein to the next, they release small packets of energy. This energy is used to pump hydrogen ions across the membrane, building up pressure. When those ions flow back through ATP synthase, it's like the pressurized water turning the wheel -- that mechanical motion assembles ATP, the cell's energy currency.",
  citationNote: null,
  sources: [],
  isShowingOriginal: false,
};

// ---------------------------------------------------------------------------
// Child leads on msg-2
// ---------------------------------------------------------------------------
const CHILD_LEAD_LIGHT: ChildLead = {
  threadId: 'child-thread-1',
  paragraphIndex: 2,
  anchorText: 'light reactions',
  messageCount: 2,
};

const CHILD_LEAD_CALVIN: ChildLead = {
  threadId: 'child-thread-2',
  paragraphIndex: 4,
  anchorText: 'Calvin cycle',
  messageCount: 2,
};

// ---------------------------------------------------------------------------
// Root thread messages
// ---------------------------------------------------------------------------

const MSG_1: Message = {
  id: 'msg-1',
  threadId: 'root-thread-1',
  role: 'user',
  content: 'How does photosynthesis work?',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_000_000,
};

const MSG_2_CONTENT = `Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. It takes place primarily in the chloroplasts of plant cells and can be divided into two main stages.

The key pigment driving this process is **chlorophyll**, located in the thylakoid membranes of chloroplasts. Chlorophyll absorbs light most efficiently in the blue and red wavelengths, reflecting green light -- which is why most plants appear green to our eyes.

The first stage consists of the **light reactions**, which occur in the thylakoid membranes. Here, light energy is captured by photosystems I and II, splitting water molecules and releasing oxygen as a byproduct. The energy from light excites electrons, which are passed along a chain of proteins.

These excited electrons power the **electron transport chain**, which pumps hydrogen ions across the thylakoid membrane. The resulting proton gradient drives ATP synthase to produce ATP, while NADP+ is reduced to NADPH. Both ATP and NADPH are essential energy carriers for the next stage.

The second stage is the **Calvin cycle** (also called the light-independent reactions), which takes place in the stroma. Using the ATP and NADPH from the light reactions, CO2 from the atmosphere is fixed into a three-carbon compound by the enzyme RuBisCO, eventually producing glucose.

\`\`\`
Overall equation:
6CO2 + 6H2O + light energy --> C6H12O6 + 6O2
\`\`\``;

const MSG_2: Message = {
  id: 'msg-2',
  threadId: 'root-thread-1',
  role: 'assistant',
  content: MSG_2_CONTENT,
  annotations: [CITATION_ANN, SIMPLIFICATION_ANN],
  childLeads: [CHILD_LEAD_LIGHT, CHILD_LEAD_CALVIN],
  isStreaming: false,
  createdAt: 1_700_000_001_000,
};

const MSG_3: Message = {
  id: 'msg-3',
  threadId: 'root-thread-1',
  role: 'user',
  content: 'Why are leaves green?',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_002_000,
};

const MSG_4: Message = {
  id: 'msg-4',
  threadId: 'root-thread-1',
  role: 'assistant',
  content: `Leaves appear green because of chlorophyll's **absorption spectrum**. Chlorophyll a absorbs strongly at ~430 nm (blue) and ~662 nm (red), while chlorophyll b absorbs at ~453 nm and ~642 nm. The green wavelengths (~500-565 nm) are mostly reflected or transmitted, which is the light that reaches our eyes.

Interestingly, in autumn many deciduous trees stop producing chlorophyll. As the green pigment breaks down, other pigments that were always present -- carotenoids (yellow/orange) and anthocyanins (red/purple) -- become visible, creating the vivid fall foliage we enjoy.`,
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_003_000,
};

// ---------------------------------------------------------------------------
// Child thread 1: Light reactions (depth 1)
// ---------------------------------------------------------------------------

const MSG_C1: Message = {
  id: 'msg-c1',
  threadId: 'child-thread-1',
  role: 'user',
  content: 'Break down the light reactions step by step',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_010_000,
};

const MSG_C2_CONTENT = `The light reactions occur across the thylakoid membrane and involve several coordinated steps:

**1. Photosystem II (PSII)** absorbs light at 680 nm. The energy excites electrons in the reaction center chlorophyll (P680). To replace these lost electrons, water molecules are split (photolysis): 2H2O -> 4H+ + 4e- + O2. This is the source of the oxygen we breathe.

**2. Electron transport** -- The excited electrons pass through a chain of carriers: pheophytin, plastoquinone (PQ), the cytochrome b6f complex, and plastocyanin (PC). At each step, the electrons lose energy, which is used to pump H+ ions from the stroma into the thylakoid lumen.

**3. Photosystem I (PSI)** absorbs light at 700 nm, re-energizing the electrons. They pass through ferredoxin and finally reduce NADP+ to NADPH via the enzyme NADP+ reductase.

**4. ATP synthase** harnesses the proton gradient (chemiosmosis). H+ ions flow back through ATP synthase from the lumen to the stroma, and the rotary motor mechanism of this enzyme catalyzes: ADP + Pi -> ATP.

The net products of the light reactions are ATP, NADPH, and O2 -- all essential for the Calvin cycle that follows.`;

const CHILD_LEAD_ATP: ChildLead = {
  threadId: 'grandchild-thread-1',
  paragraphIndex: 4,
  anchorText: 'ATP synthase',
  messageCount: 2,
};

const MSG_C2: Message = {
  id: 'msg-c2',
  threadId: 'child-thread-1',
  role: 'assistant',
  content: MSG_C2_CONTENT,
  annotations: [],
  childLeads: [CHILD_LEAD_ATP],
  isStreaming: false,
  createdAt: 1_700_000_011_000,
};

// ---------------------------------------------------------------------------
// Child thread 2: Calvin cycle (depth 1)
// ---------------------------------------------------------------------------

const MSG_C3: Message = {
  id: 'msg-c3',
  threadId: 'child-thread-2',
  role: 'user',
  content: 'How exactly does CO2 get fixed in the Calvin cycle?',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_020_000,
};

const MSG_C4: Message = {
  id: 'msg-c4',
  threadId: 'child-thread-2',
  role: 'assistant',
  content: `Carbon fixation in the Calvin cycle is catalyzed by the enzyme **RuBisCO** (ribulose-1,5-bisphosphate carboxylase/oxygenase), the most abundant protein on Earth.

RuBisCO attaches a CO2 molecule to a five-carbon sugar called **ribulose-1,5-bisphosphate (RuBP)**. The resulting six-carbon compound is unstable and immediately splits into two molecules of **3-phosphoglycerate (3-PGA)**.

These 3-PGA molecules are then reduced using ATP and NADPH from the light reactions, producing **glyceraldehyde-3-phosphate (G3P)**. For every three CO2 molecules fixed, six G3P molecules are produced -- but only one exits the cycle. The other five are recycled to regenerate RuBP, restarting the cycle.

The exported G3P molecules are used to build glucose, sucrose, starch, and other organic molecules the plant needs for growth and energy storage.`,
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_021_000,
};

// ---------------------------------------------------------------------------
// Grandchild thread: ATP synthase (depth 2)
// ---------------------------------------------------------------------------

const MSG_G1: Message = {
  id: 'msg-g1',
  threadId: 'grandchild-thread-1',
  role: 'user',
  content: 'How does the ATP synthase motor actually work?',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_030_000,
};

const MSG_G2: Message = {
  id: 'msg-g2',
  threadId: 'grandchild-thread-1',
  role: 'assistant',
  content: `ATP synthase is a remarkable molecular machine that works like a **rotary motor**. It consists of two main parts:

**F0 (membrane-embedded):** A ring of c-subunits sits within the thylakoid membrane. As H+ ions flow through F0 down their concentration gradient, they push against the c-subunits, causing the ring to physically rotate -- much like water turning a turbine.

**F1 (stroma-facing):** The rotating central shaft (gamma subunit) extends up into the F1 head, which contains three catalytic beta subunits arranged in a ring. As the shaft rotates, it sequentially changes the conformation of each beta subunit through three states: open (binds ADP + Pi), loose (closes around substrates), and tight (catalyzes ATP formation and releases it).

Each full 360-degree rotation of the motor produces **3 ATP molecules** -- one from each beta subunit. The entire machine can spin at over 100 revolutions per second, making it one of nature's most efficient energy converters (~nearly 100% efficiency).

This was confirmed experimentally by attaching a fluorescent actin filament to the gamma subunit and directly observing the rotation under a microscope -- a landmark experiment by Noji et al. (1997).`,
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_031_000,
};

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

const ROOT_THREAD: Thread = {
  id: 'root-thread-1',
  depth: 0,
  parentThreadId: null,
  anchorText: null,
  parentMessageId: null,
  title: 'How does photosynthesis work?',
  accentColor: '#2D7DD2',
  messageIds: ['msg-1', 'msg-2', 'msg-3', 'msg-4'],
  childThreadIds: ['child-thread-1', 'child-thread-2'],
  scrollPosition: 0,
};

const CHILD_THREAD_1: Thread = {
  id: 'child-thread-1',
  depth: 1,
  parentThreadId: 'root-thread-1',
  anchorText: 'light reactions',
  parentMessageId: 'msg-2',
  title: 'Light reactions step by step',
  accentColor: '#E8AA14',
  messageIds: ['msg-c1', 'msg-c2'],
  childThreadIds: ['grandchild-thread-1'],
  scrollPosition: 0,
};

const CHILD_THREAD_2: Thread = {
  id: 'child-thread-2',
  depth: 1,
  parentThreadId: 'root-thread-1',
  anchorText: 'Calvin cycle',
  parentMessageId: 'msg-2',
  title: 'Calvin cycle carbon fixation',
  accentColor: '#97CC04',
  messageIds: ['msg-c3', 'msg-c4'],
  childThreadIds: [],
  scrollPosition: 0,
};

const GRANDCHILD_THREAD_1: Thread = {
  id: 'grandchild-thread-1',
  depth: 2,
  parentThreadId: 'child-thread-1',
  anchorText: 'ATP synthase',
  parentMessageId: 'msg-c2',
  title: 'ATP synthase rotary motor',
  accentColor: '#F45D01',
  messageIds: ['msg-g1', 'msg-g2'],
  childThreadIds: [],
  scrollPosition: 0,
};

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const DEMO_SESSION = {
  id: 'demo-session-1',
  createdAt: 1_700_000_000_000,
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const DEMO_THREADS: Record<string, Thread> = {
  'root-thread-1': ROOT_THREAD,
  'child-thread-1': CHILD_THREAD_1,
  'child-thread-2': CHILD_THREAD_2,
  'grandchild-thread-1': GRANDCHILD_THREAD_1,
};

export const DEMO_MESSAGES: Record<string, Message> = {
  'msg-1': MSG_1,
  'msg-2': MSG_2,
  'msg-3': MSG_3,
  'msg-4': MSG_4,
  'msg-c1': MSG_C1,
  'msg-c2': MSG_C2,
  'msg-c3': MSG_C3,
  'msg-c4': MSG_C4,
  'msg-g1': MSG_G1,
  'msg-g2': MSG_G2,
};

export const DEMO_ROOT_THREAD_ID = 'root-thread-1';
export const DEMO_CHILD_THREAD_ID = 'child-thread-1';
