import type { Thread, Message, Annotation, ChildLead, SourceResult } from '../../types/index';

// ---------------------------------------------------------------------------
// Sources for the citation annotation on msg-2 paragraph 1 (chain rule)
// ---------------------------------------------------------------------------
const CHAIN_RULE_SOURCES: SourceResult[] = [
  {
    title: 'Backpropagation Algorithm Explained',
    url: 'https://cs231n.github.io/optimization-2/',
    domain: 'cs231n.github.io',
    snippet:
      'The chain rule of calculus is the key mathematical tool behind backpropagation, allowing gradients to flow from the loss back through every layer.',
  },
  {
    title: 'Calculus on Computational Graphs',
    url: 'https://colah.github.io/posts/2015-08-Backprop/',
    domain: 'colah.github.io',
    snippet:
      "Colah's blog post traces backpropagation through computational graphs, showing how the chain rule generalises to arbitrary network architectures.",
  },
  {
    title: 'Deep Learning Book — Chapter 6',
    url: 'https://www.deeplearningbook.org/contents/mlp.html',
    domain: 'deeplearningbook.org',
    snippet:
      'Goodfellow et al. present a rigorous treatment of multi-layer perceptrons and the backpropagation algorithm used to compute their gradients.',
  },
];

// ---------------------------------------------------------------------------
// Annotations on msg-2
// ---------------------------------------------------------------------------
const CITATION_ANN: Annotation = {
  id: 'ann-citation-1',
  type: 'source',
  targetText: 'chain rule and gradient computation',
  paragraphIndex: 1,
  originalText: 'chain rule and gradient computation',
  replacementText: null,
  citationNote:
    'The chain rule is the mathematical foundation of backpropagation, enabling efficient gradient computation through composed functions.',
  sources: CHAIN_RULE_SOURCES,
  isShowingOriginal: false,
};

const SIMPLIFICATION_ANN: Annotation = {
  id: 'ann-simplification-1',
  type: 'simplification',
  targetText: 'vanishing gradients',
  paragraphIndex: 4,
  // mode key stored in originalText — MarkdownRenderer reads MODE_LABELS['analogy'] = 'Analogy'
  originalText: 'analogy',
  replacementText:
    "Think of backpropagation like a game of telephone. The gradient signal starts strong at the output layer, but as it passes backward through each layer, it gets a little weaker — like a whispered message losing clarity. With many layers, the signal can fade to nearly nothing, which is why the earliest layers barely learn. This is the vanishing gradient problem.",
  citationNote: null,
  sources: [],
  isShowingOriginal: false,
};

// ---------------------------------------------------------------------------
// Child lead on msg-2  (paragraph 1 → child-thread-1)
// ---------------------------------------------------------------------------
const CHILD_LEAD_1: ChildLead = {
  threadId: 'child-thread-1',
  paragraphIndex: 1,
  anchorText: 'chain rule and gradient computation',
  messageCount: 2,
};

// ---------------------------------------------------------------------------
// Root thread messages
// ---------------------------------------------------------------------------

const MSG_1: Message = {
  id: 'msg-1',
  threadId: 'root-thread-1',
  role: 'user',
  content: 'Explain how neural networks learn through backpropagation',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_000_000,
};

const MSG_2_CONTENT = `Backpropagation is the engine that drives learning in neural networks. During training, the network makes a prediction, compares it to the true label via a loss function, and then propagates the resulting error signal backward through every layer — adjusting each weight to reduce that error.

At the heart of backpropagation lies **chain rule and gradient computation**. The loss is a composed function of every activation and weight in the network, so the gradient of the loss with respect to an early-layer weight is computed by multiplying a chain of local derivatives all the way from the output back to that weight.

Once the gradients are known, each weight is nudged in the direction that reduces the loss. The size of each nudge is controlled by the **learning rate** — a hyperparameter that balances convergence speed against stability.

\`\`\`python
# Forward pass
z = weights @ inputs + bias
activation = sigmoid(z)

# Backward pass
error = activation - target
gradient = error * sigmoid_derivative(z)
weights -= learning_rate * gradient @ inputs.T
\`\`\`

Deep networks can suffer from **vanishing gradients**: as the chain of derivatives is multiplied together, small values compound and the gradient reaching early layers approaches zero, stalling learning.`;

const MSG_2: Message = {
  id: 'msg-2',
  threadId: 'root-thread-1',
  role: 'assistant',
  content: MSG_2_CONTENT,
  annotations: [CITATION_ANN, SIMPLIFICATION_ANN],
  childLeads: [CHILD_LEAD_1],
  isStreaming: false,
  createdAt: 1_700_000_001_000,
};

const MSG_3: Message = {
  id: 'msg-3',
  threadId: 'root-thread-1',
  role: 'user',
  content: 'How does the learning rate affect convergence?',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_002_000,
};

const MSG_4: Message = {
  id: 'msg-4',
  threadId: 'root-thread-1',
  role: 'assistant',
  content: `The learning rate is one of the most impactful hyperparameters in training. A **high learning rate** causes large weight updates that can overshoot the minimum, producing oscillations or even divergence. A **low learning rate** takes tiny, cautious steps — convergence is stable but painfully slow.

Most practitioners use adaptive optimisers like Adam or RMSProp that adjust each parameter's effective learning rate individually, reducing the sensitivity to the initial choice. Learning rate schedules (warm-up then decay) further improve convergence by starting large and refining as the loss plateau is approached.`,
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_003_000,
};

// ---------------------------------------------------------------------------
// Child thread messages
// ---------------------------------------------------------------------------

const MSG_C1: Message = {
  id: 'msg-c1',
  threadId: 'child-thread-1',
  role: 'user',
  content: 'Can you break down the chain rule step by step?',
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_010_000,
};

const MSG_C2: Message = {
  id: 'msg-c2',
  threadId: 'child-thread-1',
  role: 'assistant',
  content: [
    'The chain rule states that if *y* depends on *u* and *u* depends on *x*, then `dy/dx = (dy/du) x (du/dx)`.',
    'In a neural network each layer is one link in this chain: the gradient of the loss flows through every activation and weight matrix on its way back to the inputs.',
    '',
    'Concretely, suppose your network has three layers with activations `a1`, `a2`, and output `y_hat`.',
    'The gradient of the loss *L* with respect to the first layer\'s weight is:',
    '',
    '`dL/dW1 = (dL/dy_hat) x (dy_hat/da2) x (da2/da1) x (da1/dW1)`',
    '',
    'Each factor is a local derivative computed during the forward pass and cached for the backward pass.',
    'This is why automatic differentiation frameworks like PyTorch and JAX can handle networks of arbitrary depth — they simply accumulate these local Jacobians.',
  ].join('\n'),
  annotations: [],
  childLeads: [],
  isStreaming: false,
  createdAt: 1_700_000_011_000,
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
  title: 'Root',
  accentColor: '#2D7DD2',
  messageIds: ['msg-1', 'msg-2', 'msg-3', 'msg-4'],
  childThreadIds: ['child-thread-1'],
  scrollPosition: 0,
};

const CHILD_THREAD: Thread = {
  id: 'child-thread-1',
  depth: 1,
  parentThreadId: 'root-thread-1',
  anchorText: 'chain rule and gradient computation',
  parentMessageId: 'msg-2',
  title: 'chain rule and gradient',
  accentColor: '#E8AA14',
  messageIds: ['msg-c1', 'msg-c2'],
  childThreadIds: [],
  scrollPosition: 0,
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const DEMO_THREADS: Record<string, Thread> = {
  'root-thread-1': ROOT_THREAD,
  'child-thread-1': CHILD_THREAD,
};

export const DEMO_MESSAGES: Record<string, Message> = {
  'msg-1': MSG_1,
  'msg-2': MSG_2,
  'msg-3': MSG_3,
  'msg-4': MSG_4,
  'msg-c1': MSG_C1,
  'msg-c2': MSG_C2,
};

export const DEMO_ROOT_THREAD_ID = 'root-thread-1';
export const DEMO_CHILD_THREAD_ID = 'child-thread-1';
