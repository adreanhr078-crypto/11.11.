# Emotion Visual Tuning

`emotion-visual.json` controls how Echo's canonical personality is translated
into presentation intent. Designers can tune the system without editing
TypeScript.

The six blended channels are:

- humanity
- trust
- fear
- anger
- sadness
- corruption

Every channel contributes to atmosphere, color grading, glitch, cinematic
motion and sound mood. Values are continuous and blended; this avoids abrupt
theme switches when personality stats change by a small amount.

No asset IDs or story content belong in this file. Sound and rendering
adapters consume the generated mood profile and decide which future assets or
platform effects implement it.

Validate changes with `npm run validate:content`. Editor hints are provided by
`../schemas/emotion-visual.schema.json`.

