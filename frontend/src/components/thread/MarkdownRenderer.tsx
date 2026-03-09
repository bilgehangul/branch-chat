import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

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
}: {
  content: string;
}) {
  return (
    <div className="prose prose-invert prose-zinc max-w-none text-zinc-100">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeAddParagraphIds]}
      components={{
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
              className="bg-zinc-800 text-zinc-200 rounded px-1 py-0.5 text-sm font-mono"
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
