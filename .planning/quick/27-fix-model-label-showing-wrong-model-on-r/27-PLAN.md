---
phase: quick-27
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/thread/MessageBlock.tsx
  - frontend/src/components/thread/MessageList.tsx
autonomous: true
requirements: [BUG-model-label, BUG-pill-alignment]
must_haves:
  truths:
    - "AI response label shows the BYOK model name (e.g. GPT-5.4) when user is in BYOK mode"
    - "AI response label shows the free-tier model name (from /api/config) when user is on free tier"
    - "Branch pills appear next to the specific paragraph they were branched from, not centered on the entire message"
  artifacts:
    - path: "frontend/src/components/thread/MessageBlock.tsx"
      provides: "BYOK-aware model label"
    - path: "frontend/src/components/thread/MessageList.tsx"
      provides: "Per-paragraph pill alignment via sub-rows"
  key_links:
    - from: "MessageBlock.tsx"
      to: "SettingsContext"
      via: "useSettings() for tier/byokModel"
      pattern: "useSettings.*tier.*byokModel"
    - from: "MessageList.tsx"
      to: "GutterColumn.tsx"
      via: "BranchPillCell rendered per paragraph group"
      pattern: "BranchPillCell"
---

<objective>
Fix two bugs: (1) model label on AI responses always shows the free-tier "Gemini Flash 2.0" even when BYOK is active, and (2) branch pills are vertically centered on the whole message instead of aligned to the specific paragraph where the branch was created.

Purpose: Correct visual feedback so users see which model actually generated each response, and branch pills appear at the paragraph they originated from.
Output: Updated MessageBlock.tsx and MessageList.tsx
</objective>

<context>
@frontend/src/components/thread/MessageBlock.tsx
@frontend/src/components/thread/MessageList.tsx
@frontend/src/components/branching/GutterColumn.tsx
@frontend/src/constants/models.ts
@frontend/src/contexts/SettingsContext.tsx
@frontend/src/api/config.ts

<interfaces>
From frontend/src/contexts/SettingsContext.tsx:
```typescript
export type ByokProvider = 'gemini' | 'openai' | 'anthropic';
export type Tier = 'free' | 'byok';
export function useSettings(): {
  tier: Tier;
  byokProvider: ByokProvider | null;
  byokModel: string | null;
  // ...other fields
};
```

From frontend/src/constants/models.ts:
```typescript
export const MODEL_LISTS: Record<ByokProvider, { id: string; label: string }[]>;
```

From frontend/src/api/config.ts:
```typescript
export async function getModelLabel(): Promise<string>;
```

From frontend/src/types/index.ts:
```typescript
interface ChildLead {
  threadId: string;
  paragraphIndex: number;
  anchorText: string;
}
interface Message {
  childLeads: ChildLead[];
  // ...
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix model label to show BYOK model when active</name>
  <files>frontend/src/components/thread/MessageBlock.tsx</files>
  <action>
The model label above AI responses currently calls `getModelLabel()` which fetches from `/api/config` — this always returns the server's free-tier model name ("Gemini Flash 2.0"). It has no awareness of BYOK settings.

Fix by importing `useSettings` from `../../contexts/SettingsContext` and `MODEL_LISTS` from `../../constants/models.ts`. Replace the `getModelLabel()` useEffect with a derived label:

1. Remove the `import { getModelLabel } from '../../api/config';` import.
2. Add `import { useSettings } from '../../contexts/SettingsContext';` and `import { MODEL_LISTS } from '../../constants/models';`.
3. Replace the `useState('AI')` + `useEffect` block (lines 40-43) with:
   - Call `const { tier, byokProvider, byokModel } = useSettings();`
   - Keep `getModelLabel()` for free tier only: `const [freeLabel, setFreeLabel] = useState('AI');` with `useEffect(() => { if (tier !== 'byok') getModelLabel().then(setFreeLabel); }, [tier]);`
   - Compute: `const modelLabel = (tier === 'byok' && byokProvider && byokModel) ? (MODEL_LISTS[byokProvider]?.find(m => m.id === byokModel)?.label ?? byokModel) : freeLabel;`
4. Keep the `getModelLabel` import since it's still used for the free tier path.

This ensures: BYOK users see the actual model name (e.g. "GPT-5.4"), free-tier users see the server-configured label (e.g. "Gemini Flash 2.0").
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>When tier=byok with byokModel="gpt-5.4", the label above AI responses reads "GPT-5.4" (from MODEL_LISTS). When tier=free, it still reads "Gemini Flash 2.0" (from /api/config).</done>
</task>

<task type="auto">
  <name>Task 2: Align branch pills to their anchor paragraph</name>
  <files>frontend/src/components/thread/MessageList.tsx</files>
  <action>
Currently, MessageList renders one grid row per message: message content in column 1, all pills for that message in column 2 with `self-center`. This centers pills vertically on the entire message, not on the specific paragraph they were created from.

The MarkdownRenderer inside MessageBlock renders paragraphs with `data-paragraph-id` attributes. Each `ChildLead` has a `paragraphIndex`. The fix: instead of rendering ALL pills for a message in a single column-2 cell, group pills by `paragraphIndex` and use a nested layout so each pill group aligns to its source paragraph.

Implementation approach — use a wrapper div with relative positioning:

1. Change the column-2 cell from `self-center` to `self-stretch` so it spans the full height of the message.
2. Inside the column-2 cell, use a flex column with `justify-between` or explicit spacing that distributes pill groups across the message height proportionally.

However, since we cannot easily know paragraph DOM positions from MessageList (paragraphs are inside MessageBlock's MarkdownRenderer), a simpler and more robust approach:

**Split message content into per-paragraph grid rows.** Instead of one grid row per message, emit one grid row per paragraph for assistant messages (user messages stay as single rows since they don't have branch pills):

For assistant messages:
1. Split `msg.content` by `\n\n` to count paragraphs (same split MarkdownRenderer uses).
2. Group `leadsForMessage` by `lead.paragraphIndex` into a `Map<number, ChildLead[]>`.
3. Render the message content in column 1 spanning all paragraph rows using `gridRow: span N` (where N = paragraph count). This preserves the single MessageBlock rendering.
4. For column 2, render N cells — one per paragraph row. Each cell contains only the pills whose `paragraphIndex` matches that row index. Empty cells render as empty divs to maintain grid structure.
5. Each pill cell uses `self-center` to center within its paragraph-height row.

For user messages (no pills): render as before — single row, column 1 content, column 2 empty.

Concrete changes to `MessageList.tsx`:
- For each assistant message, count paragraphs: `const paragraphs = msg.content.split(/\n\n+/);` then `const paraCount = Math.max(paragraphs.length, 1);`
- Group leads: `const leadsByPara = new Map<number, ChildLead[]>(); leadsForMessage.forEach(l => { const arr = leadsByPara.get(l.paragraphIndex) ?? []; arr.push(l); leadsByPara.set(l.paragraphIndex, arr); });`
- Column 1 (message): `<div className="min-w-0" style={{ gridRow: \`span ${paraCount}\` }}>` wrapping MessageBlock
- Column 2: render `paraCount` divs, each containing `BranchPillCell` only if `leadsByPara.has(i)` for that index, with `self-center` alignment.
- For user messages or messages with no childLeads, keep the simple single-row layout (no splitting needed).

**Important:** Only split into sub-rows for assistant messages that have at least one childLead. Otherwise keep the simple 1-row layout to avoid unnecessary DOM overhead.
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Branch pills appear vertically aligned next to the paragraph they were branched from, not centered on the entire message. Messages without branch pills render unchanged.</done>
</task>

</tasks>

<verification>
1. `cd frontend && npx tsc --noEmit` — zero errors
2. Visual check: Send a multi-paragraph message using a BYOK OpenAI model. The label above the AI response should show the OpenAI model name (e.g. "GPT-5.4"), not "Gemini Flash 2.0".
3. Visual check: Create a branch from a specific paragraph in a multi-paragraph response. The branch pill should appear next to that paragraph, not centered on the entire message.
</verification>

<success_criteria>
- Model label reflects the actual model used (BYOK model name when tier=byok, server label when tier=free)
- Branch pills align to their source paragraph via per-paragraph grid sub-rows
- TypeScript compiles with zero errors
- No regressions in message rendering or pill interactions
</success_criteria>

<output>
After completion, create `.planning/quick/27-fix-model-label-showing-wrong-model-on-r/27-SUMMARY.md`
</output>
