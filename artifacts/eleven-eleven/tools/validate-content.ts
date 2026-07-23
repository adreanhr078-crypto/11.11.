import {
  CONTENT_COUNTS,
  CONTENT_MANIFEST,
  validateContentRegistry,
} from '../src/infrastructure/content/contentRegistry';

validateContentRegistry();

console.log(JSON.stringify({
  valid: true,
  schemaVersion: CONTENT_MANIFEST.schemaVersion,
  contentVersion: CONTENT_MANIFEST.contentVersion,
  counts: CONTENT_COUNTS,
  capacity: CONTENT_MANIFEST.capacity,
}, null, 2));
