import { test } from 'vitest';

// INLINE-04: inline error block with retry on API failure
test.todo('AnnotationError: renders inline error block when Find Sources API fails');
test.todo("AnnotationError: error block shows \"Couldn't load sources\" message");
test.todo('AnnotationError: Retry button re-triggers the API call');
test.todo('AnnotationError: renders inline error block when Simplify API fails');
test.todo('AnnotationError: error block disappears and shimmer appears on retry click');
