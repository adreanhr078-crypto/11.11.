---description: Review code or assets in the 11.11 project for quality, accessibility, and canon compliance.---
# /review — Code & Asset Review

Review code, UI, or assets for quality and compliance.

## Usage

/review <target> — where target is one of:
- `code <path>` — review code file/directory
- `ui <surface>` — review UI screen/panel
- `puzzle <id>` — review a puzzle
- `asset <path>` — review a media asset
- `chess` — review chess implementation
- `audio` — review audio system

## Review checklist

### Code review
- [ ] TypeScript strict, no `any`
- [ ] Bilingual (ar/en) for player-facing strings
- [ ] Accessibility: ARIA, focus, reduced-motion
- [ ] Mute/volume respects preferences
- [ ] No secrets, tokens, or PII logged
- [ ] Server-side reward authority preserved
- [ ] Tests cover the change

### UI review
- [ ] Visual contract compliance (obsidian, signal crimson, pale ivory)
- [ ] No readable text in generated images
- [ ] Color-independent state cues
- [ ] Touch targets >= 44px
- [ ] RTL/LTR support
- [ ] Reduced-motion alternative
- [ ] Loading, error, empty states

### Asset review
- [ ] Under size budget
- [ ] Correct format (WebP/MP4/WAV/OGG)
- [ ] Alpha verified (images)
- [ ] Codec verified (videos)
- [ ] No readable text/logos
- [ ] Stable versioned filename

### Canon review
- [ ] Story fragment reveals (puzzles)
- [ ] Echo character consistency
- [ ] No contradicting canon facts
- [ ] Achievement linkage correct
