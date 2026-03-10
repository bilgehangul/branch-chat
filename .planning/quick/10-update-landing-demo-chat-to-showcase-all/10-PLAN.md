---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/demo/DemoChat.tsx
  - frontend/src/components/demo/demoData.ts
autonomous: true
requirements: [QUICK-10]

must_haves:
  truths:
    - "Unauthenticated visitor sees a rich static conversation showcasing branching, annotations, gutter pills, breadcrumbs, markdown with code, and the full visual design"
    - "Clicking any interactive element (input, gutter pill, action bubble buttons, breadcrumb links) triggers the sign-in modal instead of performing the real action"
    - "Demo renders without any API calls or Zustand store usage"
  artifacts:
    - path: "frontend/src/components/demo/demoData.ts"
      provides: "Static fake thread/message/annotation data"
    - path: "frontend/src/components/demo/DemoChat.tsx"
      provides: "Full demo layout rendering all app features statically"
  key_links:
    - from: "frontend/src/components/demo/DemoChat.tsx"
      to: "frontend/src/App.tsx"
      via: "onSignInClick prop"
      pattern: "onSignInClick"
---

<objective>
Replace the simple 4-message DemoChat with a visually rich static showcase that demonstrates every major app feature: multi-turn conversation with markdown and code blocks, a child thread branch with context card, gutter pills in the sidebar, breadcrumb navigation, inline annotations (Find Sources citation block + Simplify block), and the action bubble. All interactive elements intercept clicks to trigger the sign-in modal.

Purpose: Entice unauthenticated visitors to sign up by showing the full power of the app.
Output: Updated DemoChat.tsx + new demoData.ts with static fake data.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/App.tsx
@frontend/src/components/demo/DemoChat.tsx
@frontend/src/types/index.ts
@frontend/src/components/thread/MessageBlock.tsx
@frontend/src/components/thread/MarkdownRenderer.tsx
@frontend/src/components/thread/ContextCard.tsx
@frontend/src/components/annotations/CitationBlock.tsx
@frontend/src/components/annotations/SimplificationBlock.tsx
@frontend/src/components/branching/GutterColumn.tsx
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/components/layout/BreadcrumbBar.tsx
@frontend/src/components/layout/AppShell.tsx

<interfaces>
<!-- Key types the demo data file must conform to -->

From frontend/src/types/index.ts:
```typescript
export interface Thread {
  id: string;
  depth: 0 | 1 | 2 | 3 | 4;
  parentThreadId: string | null;
  anchorText: string | null;
  parentMessageId: string | null;
  title: string;
  accentColor: string;
  messageIds: string[];
  childThreadIds: string[];
  scrollPosition: number;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  annotations: Annotation[];
  childLeads: ChildLead[];
  isStreaming: boolean;
  createdAt: number;
}

export interface Annotation {
  id: string;
  type: 'source' | 'rewrite' | 'simplification';
  targetText: string;
  paragraphIndex: number;
  originalText: string;
  replacementText: string | null;
  citationNote: string | null;
  sources: SourceResult[];
  isShowingOriginal: boolean;
}

export interface SourceResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface ChildLead {
  threadId: string;
  paragraphIndex: number;
  anchorText: string;
  messageCount: number;
}
```

From DemoChat.tsx (current interface — keep this prop):
```typescript
interface DemoChatProps {
  onSignInClick: () => void;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create static demo data file with fake threads, messages, and annotations</name>
  <files>frontend/src/components/demo/demoData.ts</files>
  <action>
Create `demoData.ts` exporting static data that represents a realistic conversation showcasing all features. Use hardcoded UUIDs (deterministic, no crypto.randomUUID). All data conforms to the Thread/Message/Annotation/ChildLead types from `../../types/index`.

**Root thread** ("root-thread-1", depth 0, title "Root", accentColor "#2D7DD2"):
- User message (msg-1): "Explain how neural networks learn through backpropagation"
- AI message (msg-2): Multi-paragraph markdown response covering:
  - Paragraph 0: Overview paragraph about backpropagation
  - Paragraph 1: A paragraph about the chain rule and gradient computation (this paragraph will have a childLead branching off to a child thread, AND a Find Sources citation annotation)
  - Paragraph 2: A paragraph about weight updates and learning rate
  - Paragraph 3: A code block showing a simple Python backprop step:
    ```python
    # Forward pass
    z = weights @ inputs + bias
    activation = sigmoid(z)

    # Backward pass
    error = activation - target
    gradient = error * sigmoid_derivative(z)
    weights -= learning_rate * gradient @ inputs.T
    ```
  - Paragraph 4: A concluding paragraph about vanishing gradients (this paragraph will have a Simplification annotation)
- User message (msg-3): "How does the learning rate affect convergence?"
- AI message (msg-4): 2-paragraph response about learning rate (shorter, showing multi-turn)

**Annotations on msg-2:**
1. `type: 'source'` on paragraphIndex 1 (chain rule paragraph):
   - 3 sources with realistic titles/urls/domains:
     - "Backpropagation Algorithm Explained" / "https://cs231n.github.io/optimization-2/" / "cs231n.github.io"
     - "Calculus on Computational Graphs" / "https://colah.github.io/posts/2015-08-Backprop/" / "colah.github.io"
     - "Deep Learning Book - Chapter 6" / "https://www.deeplearningbook.org/contents/mlp.html" / "deeplearningbook.org"
   - citationNote: "The chain rule is the mathematical foundation of backpropagation, enabling efficient gradient computation through composed functions."

2. `type: 'simplification'` on paragraphIndex 4 (vanishing gradients paragraph):
   - originalText: "analogy" (mode key)
   - replacementText: "Think of backpropagation like a game of telephone. The gradient signal starts strong at the output layer, but as it passes backward through each layer, it gets a little weaker -- like a whispered message losing clarity. With many layers, the signal can fade to nearly nothing, which is why the earliest layers barely learn. This is the vanishing gradient problem."
   - modeLabel will be derived as "Analogy" by the renderer

**ChildLead on msg-2:**
- One childLead pointing to "child-thread-1", paragraphIndex 1, anchorText "chain rule and gradient computation"

**Child thread** ("child-thread-1", depth 1, parentThreadId "root-thread-1", parentMessageId "msg-2", anchorText "chain rule and gradient computation", accentColor "#E8AA14", title "chain rule and gradient"):
- User message (msg-c1): "Can you break down the chain rule step by step?"
- AI message (msg-c2): Short 2-paragraph explanation with a formula in inline code

Export:
```typescript
export const DEMO_THREADS: Record<string, Thread> = { ... };
export const DEMO_MESSAGES: Record<string, Message> = { ... };
export const DEMO_ROOT_THREAD_ID = 'root-thread-1';
export const DEMO_CHILD_THREAD_ID = 'child-thread-1';
```

Import types from `../../types/index`.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -20</automated>
  </verify>
  <done>demoData.ts exists, exports typed static data with root thread (4 messages), child thread (2 messages), 1 citation annotation, 1 simplification annotation, 1 childLead, and compiles without type errors</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite DemoChat to render the full app layout with all features using static data</name>
  <files>frontend/src/components/demo/DemoChat.tsx</files>
  <action>
Completely rewrite DemoChat.tsx to render a visually faithful replica of the authenticated AppShell+ThreadView experience, but entirely from static data (no Zustand, no API calls, no hooks that touch real state).

**Layout structure** (mirror AppShell):
- Outer `div.flex.h-screen.bg-zinc-900.text-slate-100`
- NO session history sidebar (user has no sessions)
- Left: A single static "ancestor peek panel" strip (width ~110px) showing the root thread messages faded/truncated, visible only on sm+ screens. This demonstrates the peek panel concept. Render as a simple column of truncated message snippets with a colored left border matching the root thread accent. The child thread's parentMessageId message should have a subtle highlight background to show which message was branched from.
- Main content area (flex-col flex-1):

**Header** (h-12, border-b):
- Static breadcrumb: "Root > chain rule and gradient" (non-clickable text styled like BreadcrumbBar, with chevron separators). The "Root" part is a span styled as a clickable breadcrumb link (but onClick triggers onSignInClick). The "chain rule and gradient" part is the current non-clickable crumb.
- Theme toggle placeholder (sun/moon icon, onClick -> onSignInClick)
- "Sign in" button (onClick -> onSignInClick)

**Message area** (flex-1, overflow-y-auto, px-4):
- Show the CHILD thread view (child-thread-1) as the "active" view — this demonstrates ContextCard + branching in one screen.
- At top: Render ContextCard directly (import from `../thread/ContextCard`) passing the child thread object. This shows the "Branched from parent thread" card with the anchor text quote.
- Then render the child thread's messages using MessageBlock (import from `../thread/MessageBlock`). Pass the actual Message objects from demoData. The MarkdownRenderer inside MessageBlock will handle markdown rendering, code highlighting, and annotation blocks automatically.
- IMPORTANT: MessageBlock reads from useSessionStore for the underlineMap (threads[lead.threadId]?.accentColor). Since we are NOT using the store, we need to handle this. Two options:
  - Option A (preferred): Before rendering, temporarily hydrate the Zustand store with demo data, then clear on unmount. BUT this conflicts with the "no store" requirement.
  - Option B: Create a lightweight `DemoMessageBlock` component that renders the same visual structure as MessageBlock but without the useSessionStore call. Copy the JSX structure from MessageBlock but hardcode underlineMap from demoData childLeads.
  - **Use Option B.** Create a `DemoMessageBlock` inside DemoChat.tsx (not a separate file). It should:
    - Accept `message: Message` and `underlineMap: Record<number, string>` props
    - Render the same bubble structure as MessageBlock (user right-aligned blue bubble, AI left-aligned white/dark bubble)
    - For AI messages, render `<MarkdownRenderer>` with content, underlineMap, annotations from the message, and no pendingAnnotation/errorAnnotation
    - For user messages, render plain text in the blue bubble
    - Use the same Tailwind classes as MessageBlock for visual parity

**Gutter pills** (right side of message area):
- Render a static fake gutter pill positioned to the right of the message area, aligned roughly to the paragraph with the childLead. Create a simple static pill element (not the real GutterColumn which requires DOM measurement + ResizeObserver):
  - A div positioned absolutely or with flex layout on the right side
  - Styled like a LeadPill: white bg, border, rounded-md, shadow-sm, showing "-> chain rule and gradient" with a message count badge and colored accent dot
  - onClick -> onSignInClick
  - Below it, show a small "hover preview" card (always visible in the demo) with the child thread's first user message and AI message snippet, to demonstrate the preview feature

**Fake action bubble** (static, positioned near a paragraph):
- Render a static div styled exactly like ActionBubble (white bg, border, rounded-xl, shadow-lg, p-2) positioned near the top-right area of the message content (use relative positioning within the message area, not fixed).
- Show the 3 buttons: "-> Go Deeper" (blue), "Find Sources" (zinc-700), "Simplify" (zinc-700)
- All buttons onClick -> onSignInClick
- Add a subtle pulsing highlight or a small tooltip "Select any text to see this menu" below the bubble

**Disabled input area** (bottom):
- Same as current: disabled input + "Sign in to start your own conversation" text
- Sign in button next to input

**Sign-in overlay prompt:**
- When any interactive element is clicked, it calls onSignInClick (already passed as prop from App.tsx)
- Additionally, render a subtle semi-transparent overlay banner at the bottom of the message area (above the input) that says "Sign in to explore branching, annotations, and more" with a "Sign in" button. This serves as a persistent CTA.

**Styling notes:**
- Use dark mode classes (bg-zinc-900, text-slate-100, etc.) as the default since dark is the app default
- Import ContextCard from `../thread/ContextCard`
- Import MarkdownRenderer from `../thread/MarkdownRenderer`
- Import CitationBlock from `../annotations/CitationBlock` (only if not rendered via MarkdownRenderer)
- Import SimplificationBlock from `../annotations/SimplificationBlock` (only if not rendered via MarkdownRenderer)
- Import data from `./demoData`
- Do NOT import useSessionStore, useAuth, useStreamingChat, or any API modules
- Do NOT call any hooks that depend on auth context or store

**IMPORTANT — MarkdownRenderer annotation rendering:**
MarkdownRenderer already handles rendering CitationBlock and SimplificationBlock inline after paragraphs when annotations are passed. So DemoMessageBlock just needs to pass `annotations={message.annotations}` to MarkdownRenderer and the annotation blocks will render automatically. No need to import CitationBlock/SimplificationBlock separately.

**IMPORTANT — MarkdownRenderer onTryAnother:**
Pass `onTryAnother` as a no-op or one that calls onSignInClick. The SimplificationBlock "Try another mode" button will call this.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit --project frontend/tsconfig.app.json 2>&1 | head -30</automated>
  </verify>
  <done>DemoChat renders a full-featured static demo showing: (1) context card for child thread, (2) markdown with code block and syntax highlighting, (3) citation block with 3 sources, (4) simplification block with analogy mode, (5) static gutter pill with preview card, (6) breadcrumb navigation, (7) static action bubble, (8) ancestor peek panel, (9) all clicks route to sign-in modal. No API calls, no store dependency.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Rich static demo chat showcasing all app capabilities for unauthenticated visitors</what-built>
  <how-to-verify>
    1. Start the frontend dev server: `cd frontend && npm run dev`
    2. Open the app in browser WITHOUT signing in
    3. Verify you see:
       - A "Branched from parent thread" context card at the top with colored accent border
       - Child thread messages with markdown rendering
       - A code block with Python syntax highlighting
       - A citation block (collapsed by default, click to expand — shows 3 sources)
       - A simplification block with "Analogy" mode and rewritten text
       - A static gutter pill on the right side with thread title + preview card
       - Breadcrumb navigation in the header ("Root > chain rule and gradient")
       - A static action bubble showing Go Deeper / Find Sources / Simplify buttons
       - An ancestor peek panel on the left (on desktop)
    4. Click any interactive element and verify the sign-in modal appears
    5. Verify the overall visual impression matches the authenticated app experience
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit --project frontend/tsconfig.app.json` passes
- `npm run build --prefix frontend` succeeds
- Visual inspection confirms all features are represented in the demo
</verification>

<success_criteria>
- Unauthenticated visitors see a rich, visually impressive demo that showcases branching, annotations, gutter pills, breadcrumbs, markdown, code blocks, and the overall design
- Every clickable element in the demo triggers the sign-in modal
- No API calls are made, no Zustand store is used
- The demo compiles and renders without errors
</success_criteria>

<output>
After completion, create `.planning/quick/10-update-landing-demo-chat-to-showcase-all/10-SUMMARY.md`
</output>
