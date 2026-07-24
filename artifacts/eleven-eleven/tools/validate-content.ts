import {
  CONTENT_COUNTS,
  CONTENT_MANIFEST,
  validateContentRegistry,
} from '../src/infrastructure/content/contentRegistry';
import {
  CINEMATIC_COUNTS,
  validateCinematicContentRegistry,
} from '../src/infrastructure/content/cinematicContentRegistry';
import {
  validateEmotionVisualConfig,
} from '../src/infrastructure/presentation/emotionVisualConfigRegistry';

validateContentRegistry();
validateCinematicContentRegistry();
validateEmotionVisualConfig();

console.log(JSON.stringify({
  valid: true,
  schemaVersion: CONTENT_MANIFEST.schemaVersion,
  contentVersion: CONTENT_MANIFEST.contentVersion,
  counts: {
    ...CONTENT_COUNTS,
    ...CINEMATIC_COUNTS,
  },
  capacity: CONTENT_MANIFEST.capacity,
  presentation: {
    emotionVisual: 'valid',
  },
}, null, 2));
