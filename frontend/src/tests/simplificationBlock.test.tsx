import { test } from 'vitest';

// INLINE-06: simplification block below paragraph, both visible
test.todo('SimplificationBlock: renders header with mode label and "Try another mode" button');
test.todo('SimplificationBlock: renders replacement text in tinted block');
test.todo('SimplificationBlock: has left border accent styling');

// INLINE-07: try another mode updates existing annotation, no duplicate block
test.todo('SimplificationBlock: "Try another mode" calls onTryAnother callback');
test.todo('updateAnnotation: updates replacementText on existing annotation without adding duplicate');
test.todo('updateAnnotation: does not mutate other annotations in the same message');
