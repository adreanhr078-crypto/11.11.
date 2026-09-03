# 11.11 — Opening Cinematic Prototype and Trailer Editorial

**Status:** Owner-requested, Part-1-referenced previsual and promotional preview  
**Date:** 2026-09-03  
**Authority:** `PROJECT_VISION.md`, `project-memory.json`, final-Manhwa phase gate  
**Runtime status:** Not registered as a player cinematic, not a reward, not a story-state transition.

## Decision

Build the opening as an original premium-anime **short atmosphere**, not as a
long passive movie and not as a Genshin clone. The Owner-approved Part 1 Manhwa
is the story and visual authority. The current four owner-supplied images are
reference art for a trailer/previsual; unless a page-to-scene mapping explicitly
places them, they do not independently establish an exact chronology or a final
character model.

At launch, the safe target is:

1. A 36–42 second skippable pre-rendered Part 1 prologue, with a 10–14 second
   Blender blockout used only to prove the central camera move first.
2. A clean handoff to the authenticated Mission Control home screen.
3. The player chooses the Manhwa from the home screen rather than being forced
   into it.
4. After the approved early Manhwa-and-puzzle setup, the existing signature
   interface fracture can become the first third-person arrival.

This preserves the approved journey and the requested post-login behavior.

## Choice policy

Do **not** put a consequential narrative decision inside the first cinematic.
The player has no context yet, so a branch would feel arbitrary and make later
Canon reconciliation expensive. If interaction is wanted, use one reversible
framing choice after the player can read the first objective:

| Player prompt | Result | Must not do |
| --- | --- | --- |
| `افحص الإشارة` | Shows an optional signal fragment first. | Grant currency, alter rewards, lock content, or change Canon. |
| `تتبع الانعكاس` | Shows an optional visual fragment first. | Choose a relationship, an ending, a transformation, or a permanent faction. |

Both paths rejoin before the first puzzle. The choice is saved only as a
presentation preference if it is saved at all, and it must remain accessible,
captioned, and playable with Reduced Motion.

## Epic opening cut — recommended final shape

The opening must earn its scale through emotional contrast and a decisive handoff
to play, not through a long montage. It should feel like an original AAA anime
cinematic while preserving the distinct 11.11 grammar of glass, wet steel,
violet signal, and fragile memory.

| Time | Beat | Part 1 visual anchor | Camera / sound intention |
| --- | --- | --- | --- |
| 0–6s | A warm, ordinary breath before the disturbance. | The school-life contrast on page 3. | Quiet close detail, distant city and one restrained clock pulse. |
| 6–14s | The 11:11 signal interrupts the ordinary world. | Page 3 mark/visual dissonance and page 1 identity. | A smooth push-in; warmth drains into violet rather than a jump scare. |
| 14–25s | Match-cut into the sealed laboratory and containment architecture. | Page 2 laboratory return; owner-supplied laboratory references. | One confident continuous dolly, low mechanical hum, no readable screen text. |
| 25–33s | Witness, chamber, and reflection stop lining up. | Pages 4–6 plus the supplied reflection image. | Glass fracture, one crimson accent, no exposition dump. |
| 33–40s | The signal reaches the viewer and cuts to control. | Pages 7–9 archive/mirror pressure. | Violet flare → silent black → Mission Control. The final beat is a live accessible objective, not a baked button. |

The full opening has **no decision inside it**. It supports immediate Skip, mute,
captions, and a poster/Reduced Motion route. The first choice comes later at the
page-9 puzzle framing point, after the player has context, and remains
non-consequential until a later Owner-approved design decision.

## Blender previsual brief

The first Blender deliverable should be a 16:9, 24fps, 10–14 second technical
previsual of the laboratory movement, with no baked readable UI text and no
final voiced dialogue. It proves camera, environment scale, lighting, and the
handoff before the 36–42 second final cut receives characters, animation, sound,
and localization:

| Time | Camera and action | Player/story purpose |
| --- | --- | --- |
| 0.0–2.0s | Near-black frame; one violet pulse reflects on wet metal. | Establish the 11:11 mood without explaining it. |
| 2.0–6.0s | Slow dolly toward an abstract containment silhouette; cables and particles frame the image. | Establish scale and uncertainty. |
| 6.0–9.0s | A glass/reflection fracture interrupts the frame; sound and light peak once. | Foreshadow the later interface break without revealing its cause. |
| 9.0–12.0s | Camera pulls back into darkness; hold a clean transition frame. | Return the player to Mission Control, not the Manhwa reader. |

Use placeholder silhouettes and environment primitives until the relevant
page-to-scene matrix is approved. Do not model an approved final Echo/Yuki/Zero
likeness, render blood/torture imagery into the launch prelude, or encode names,
timestamps, dialogue, or exact chapter events into the video without a mapped
Part 1 page and localized script.

## Trailer editorial using the supplied images

The four images are strong enough for the first trailer. No additional images
are required before we review the cut. Treat the following as a promotional
editorial mapping, not a Canon event sequence:

| Source image | Trailer role | Placement | Why it works |
| --- | --- | --- | --- |
| `11_03_39 AM (4)` | Hidden laboratory pressure | Cold open, 0–4s | Establishes threat without explaining it. |
| `11_03_39 AM (1)` | Containment / observer frame | 4–9s | Best wide establishing image; it sells the world. |
| `11_03_39 AM (3)` | Identity fracture | 9–14s | Use late in the teaser, never in the playable launch opening. |
| `11_03_39 AM (2)` | Signal climax | 14–19s | Strong final eye-line and thumbnail candidate. |

The preview is silent by design. A later approved audio pass may add an
original low electrical pulse, distant rain, one glass fracture, captions, and
an independent title card. Do not bake Arabic/English title copy into source
art; render localized overlay text separately.

## Asset provenance and preview output

Owner-supplied source images are external reference inputs. Their SHA-256
hashes are recorded here so the preview is reproducible:

| Source | SHA-256 |
| --- | --- |
| `ChatGPT Image Sep 3, 2026, 11_03_39 AM (1).png` | `7621A8D74E87A89AE7EE7A441A6BD77843642BF69F37C211CFF466D312DC0F09` |
| `ChatGPT Image Sep 3, 2026, 11_03_39 AM (2).png` | `888775D21C27D9345A1ABCFD0EA82B6EC80D21585D6F272E212C5F8F6E5B8420` |
| `ChatGPT Image Sep 3, 2026, 11_03_39 AM (3).png` | `E1B3C16EA6027A1ED39DD2EFDBDAC141B5D5C8FC1803BEB8C91B2F8BBC41513E` |
| `ChatGPT Image Sep 3, 2026, 11_03_39 AM (4).png` | `4BD37565400EC7CF43FE6A848D877A818B2C1ACB1C7E9660C70906088EFDEE9A` |

Rendered preview outputs (not registered in runtime cinematic data):

- `public/assets/cinematics/promotional/echo-network-archive-teaser-v1.webm` —
  1920×1080, 24fps, 21.75s, silent VP9 WebM, 3,195,672 bytes,
  SHA-256 `29EB199ECBFA07E0BD37F995C591428ED86232459BF7AE29B89142B0B442EE4B`.
- `public/assets/cinematics/promotional/echo-network-archive-teaser-v1-poster.webp` —
  1920×1080 static fallback, 200,086 bytes,
  SHA-256 `36A3FBF4364BE2E3CAEA59199059DEB65C47C7AA3CDD892B3F99B716BA80E9CD`.

The files remain unregistered in the cinematic runtime data. If they are ever
integrated, ship them lazy-loaded with the poster as the no-video / Reduced
Motion fallback and an explicit skip control.

## Gates before live integration

1. Approve the Part 1 page-to-scene matrix and reveal classification.
2. Lock only the required first-slice characters, location, and timeline.
3. Story, localization, accessibility, and performance review of the actual
   in-game sequence.
4. Verify post-login routing still reaches Mission Control first.
5. Run media validation, Edge evidence, reduced-motion/static fallback review,
   and the mandatory autonomous quality gate.
