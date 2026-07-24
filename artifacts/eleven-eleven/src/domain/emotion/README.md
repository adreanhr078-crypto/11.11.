# Emotion Visual System

The system translates the canonical `EchoPersonality` into presentation intent.
It does not own personality state, authored assets, rendering, audio playback
or persistence.

```text
EchoPersonality
      ↓
data-tuned continuous blend
      ↓
EmotionVisualProfile
      ├── atmosphere
      ├── color grading
      ├── glitch
      ├── cinematic movement
      └── sound mood
```

`EmotionVisualProvider` computes one shared profile only when the canonical
personality object changes. Feature hooks read slices from that profile without
subscribing independently to the game store.

`EmotionVisualBridge` publishes CSS custom properties and semantic data
attributes on the game root. Platform renderers and the future application
shell may consume these values without importing Zustand.

The sound profile is passed through `EmotionSoundMoodPort`; no audio asset,
WebAudio graph or Android implementation is embedded in the domain.

The existing time-of-day theme remains intact. Emotion presentation is a
continuous layer over that world state rather than a replacement progression
model.
