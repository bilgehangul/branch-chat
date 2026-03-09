import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import type { Annotation } from '../../types/index';
import { CitationBlock } from '../annotations/CitationBlock';
import { SimplificationBlock } from '../annotations/SimplificationBlock';

// Register only needed languages to keep bundle lean
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);

const MODE_LABELS: Record<string, string> = {
  simpler: 'Simpler', example: 'Example', analogy: 'Analogy', technical: 'Technical',
};
type SimplifyMode = 'simpler' | 'example' | 'analogy' | 'technical';

// Block tags that receive data-paragraph-id for selection anchoring (BRANCH-01)
const BLOCK_TAGS = new Set([
  'p', 'pre', 'ul', 'ol', 'table', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);

// Defined outside the component for a stable reference — no re-creation on render
function rehypeAddParagraphIds() {
  return (tree: Root) => {
    let blockIndex = 0;
    visit(tree, 'element', (node: Element) => {
      if (BLOCK_TAGS.has(node.tagName)) {
        node.properties = node.properties ?? {};
        // hast camelCase 'dataParagraphId' maps to HTML attribute 'data-paragraph-id'
        node.properties['dataParagraphId'] = String(blockIndex++);
      }
    });
  };
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  underlineMap,
  annotations,
  pendingAnnotation,
  errorAnnotation,
  messageId,
  onTryAnother,
}: {
  content: string;
  underlineMap?: Record<number, string>;
  annotations?: Annotation[];
  pendingAnnotation?: { type: 'source' | 'simplification'; paragraphId?: string; messageId: string } | null;
  errorAnnotation?: { type: 'source' | 'simplification'; paragraphId?: string; messageId: string; retryFn: () => void } | null;
  messageId?: string;
  onTryAnother?: (messageId: string, annotationId: string, anchorText: string, paragraphId: string, mode: SimplifyMode) => void;
}) {
  return (
    <div className="prose prose-slate max-w-none text-slate-900">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeAddParagraphIds]}
      components={{
        p({ children, ...props }) {
          const paragraphId = (props as Record<string, unknown>)['data-paragraph-id'];
          const paragraphNum = typeof paragraphId === 'string' ? Number(paragraphId) : -1;
          const color = underlineMap?.[paragraphNum];

          const paragraphAnns = (annotations ?? []).filter(a => a.paragraphIndex === paragraphNum);
          const isPending = !!pendingAnnotation &&
            pendingAnnotation.messageId === messageId &&
            Number(pendingAnnotation.paragraphId) === paragraphNum;
          const isError = !!errorAnnotation &&
            errorAnnotation.messageId === messageId &&
            Number(errorAnnotation.paragraphId) === paragraphNum;

          return (
            <>
              <p
                {...props}
                style={color ? { textDecoration: 'underline', textDecorationColor: color } : undefined}
              >
                {children}
              </p>

              {paragraphAnns.map(ann => {
                if (ann.type === 'source') {
                  return (
                    <div key={ann.id} className="not-prose mb-2">
                      <CitationBlock annotation={ann} />
                    </div>
                  );
                }
                if (ann.type === 'simplification') {
                  const modeLabel = MODE_LABELS[ann.originalText] ?? ann.originalText;
                  return (
                    <div key={ann.id} className="not-prose mb-2">
                      <SimplificationBlock
                        annotation={ann}
                        modeLabel={modeLabel}
                        onSelectMode={(mode) => {
                          if (messageId) {
                            onTryAnother?.(messageId, ann.id, ann.targetText, String(ann.paragraphIndex), mode);
                          }
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })}

              {isPending && pendingAnnotation && (
                <div className="not-prose mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3 animate-pulse">
                  <div className="h-3 bg-slate-300 rounded w-1/3 mb-3" />
                  {pendingAnnotation.type === 'source' ? (
                    <>
                      <div className="h-3 bg-slate-300 rounded w-full mb-2" />
                      <div className="h-3 bg-slate-300 rounded w-4/5 mb-2" />
                      <hr className="border-slate-200 my-2" />
                      <div className="h-3 bg-slate-300 rounded w-2/3" />
                    </>
                  ) : (
                    <>
                      <div className="h-3 bg-slate-300 rounded w-3/4 mb-2" />
                      <div className="h-10 bg-slate-300 rounded w-full" />
                    </>
                  )}
                </div>
              )}

              {isError && errorAnnotation && (
                <div
                  className="not-prose mb-2 rounded-lg border border-red-200 bg-red-50 text-sm px-3 py-2 flex items-center justify-between"
                  data-testid="annotation-error-block"
                >
                  <span className="text-red-600 text-xs">
                    {errorAnnotation.type === 'source' ? "Couldn't load sources" : "Couldn't simplify text"}
                  </span>
                  <button
                    className="text-xs text-red-500 hover:text-red-700 underline ml-2"
                    onClick={errorAnnotation.retryFn}
                    data-testid="annotation-retry-btn"
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          );
        },
        code({ className, children, node: _node, ...props }: React.HTMLAttributes<HTMLElement> & { node?: unknown }) {
          const match = /language-(\w+)/.exec(className ?? '');
          const isBlock = !!match;
          return isBlock ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...(props as Record<string, unknown>)}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code
              className="bg-slate-100 text-slate-800 rounded px-1 py-0.5 text-sm font-mono"
              {...(props as React.HTMLAttributes<HTMLElement>)}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
});
