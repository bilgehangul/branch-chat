import { test } from 'vitest';

// updateAnnotation action (new in Phase 5)
test.todo('updateAnnotation: applies Partial<Annotation> patch to matching annotation by id');
test.todo('updateAnnotation: leaves other annotations in the message unchanged');
test.todo('updateAnnotation: no-op when annotationId does not exist in message');
test.todo('updateAnnotation: produces new object reference (immutable update)');
