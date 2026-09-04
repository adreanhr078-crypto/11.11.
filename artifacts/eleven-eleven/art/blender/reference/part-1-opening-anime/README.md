# Part 1 Opening Anime Plates

Status: **review animatic sources only**. These plates are not registered in
the runtime cinematic registry and do not change Canon, progression, rewards,
authentication, or the post-login Mission Control route.

The Blender source packs the seven active plates into the `.blend`. The separate
WebP files remain source-controlled so the animatic can be rebuilt and audited.
Every active frame is 1920x1080, contains no authored dialogue/title overlay,
and is delivered without audio. Localized text and controls must remain live
HTML/React if this concept is ever approved for runtime integration.

## Active shot order

| Time | Plate | Editorial purpose |
| --- | --- | --- |
| 0-6s | `shot-00-warm-school-breath-v1.webp` | Human warmth before the signal. |
| 6-9s | `shot-01-watch-threshold-v1.webp` | Circular warm-to-violet match-cut. |
| 9-18s | `shot-02-containment-observer-v1.webp` | Laboratory scale and containment. |
| 18-22s | `shot-03-neural-droplet-insert-v1.webp` | Finger, cable, and reverse-droplet awakening detail. |
| 22-25s | `shot-04-witness-through-glass-v1.webp` | Recognition without naming or revealing the witness. |
| 25-32s | `shot-05-reflection-fracture-v1.webp` | Human reflection and gaze/hand mismatch. |
| 32-40s | `shot-06-signal-closeup-v1.webp` | The signal reaches Echo and cuts to black. |

The three stronger Owner-supplied reveal frames are preserved as `trailer-stinger-*`
plates, but excluded from the playable-opening animatic because the chair,
dual-signal eyes, and transformed reflection reveal later visual states too early.
They remain suitable for a separately approved promotional trailer.

## Provenance and transformations

| Project plate | Input authority | Input SHA-256 | Transform | Output SHA-256 |
| --- | --- | --- | --- | --- |
| `shot-00-warm-school-breath-v1.webp` | Owner-directed generated pre-signal key art | `56C43B4CC897144BBC09EC99533E052A656521935830442376F0B55974B0A315` | 1672x941 to 1920x1080, Lanczos, WebP q94 | `E28D3CAC63E081CF6C057D4DDF32DE23155C7CC7E34EA9AD18339A015644EE14` |
| `shot-01-watch-threshold-v1.webp` | Owner-directed generated watch transition | `BE3F2003EC018D4EA2DEC03A7CE0BC5685E61967DC3C5BC3D8D64FAF23124827` | 1672x941 to 1920x1080, Lanczos, WebP q94 | `72707BA81EDF856FBE87E470DE8B6395EFAC5F543EE6F84C4EDA33AA3A452EDC` |
| `shot-02-containment-observer-v1.webp` | Owner-supplied image `(1)` | `7621A8D74E87A89AE7EE7A441A6BD77843642BF69F37C211CFF466D312DC0F09` | crop `1338x752+0+55`, scale to 1920x1080, WebP q93 | `953DD0D8BD5B2CD24E3E3B3542A7371A53B20CF89D797894E40926803BC4BA83` |
| `shot-03-neural-droplet-insert-v1.webp` | Owner-directed generated awakening insert | `33495F514157FB3A5A990F43D802C71D156E1470ADD87C683EED500299523947` | 1672x941 to 1920x1080, Lanczos, WebP q94 | `A2FECEDCDC865826228A772A0E078A623295503E11BD6060F6DE088CD57DB1E1` |
| `shot-04-witness-through-glass-v1.webp` | Owner-directed generated witness insert | `2C1ABDD912903045866FD53CD070106E92DF7A67040A6FB16E8EC2A47834B7AC` | 1672x941 to 1920x1080, Lanczos, WebP q94 | `FC10556AA5A4F8899E74E5EA0D2E5A101B978A39D6D3CE6568969A94879B2B1F` |
| `shot-05-reflection-fracture-v1.webp` | Owner-directed generated non-spoiler reflection | `364EDE4E9B75D9CC8C29016C5E6004D33D87CACD64172A1CD27515B2E50419DC` | 1672x941 to 1920x1080, Lanczos, WebP q94 | `D035C152AEA10AC965AA441D90FD5ADD8E57DFA17293FD456A39734294E6D1CF` |
| `shot-06-signal-closeup-v1.webp` | Owner-directed generated Mission Control handoff | `A83CCFDAE3C3B08020EB12D71C260D3365F32AD3038B6E6D27DC9C5F2968A58E` | 1672x941 to 1920x1080, Lanczos, WebP q94 | `5507D51017B380F2E68D54C5981AB6FD591D71580F91E52C51BBED545116CEED` |
| `trailer-stinger-owner-restraint-observation-v1.webp` | Owner-supplied image `(4)` | `4BD37565400EC7CF43FE6A848D877A818B2C1ACB1C7E9660C70906088EFDEE9A` | aspect-fill to 1920x1080, WebP q93 | `E32845FD79D28D2F50F737560567B026BF0E4B850E7054789D205D2C1390CC49` |
| `trailer-stinger-owner-dual-signal-closeup-v1.webp` | Owner-supplied image `(2)` | `888775D21C27D9345A1ABCFD0EA82B6EC80D21585D6F272E212C5F8F6E5B8420` | crop `1000x562+336+95`, scale to 1920x1080, WebP q93 | `BCFD7477BDF5B9726025219E455AEBDDF87441D60E02BEB749C8F7CC43C7AAF8` |
| `trailer-stinger-owner-transformation-reflection-v1.webp` | Owner-supplied image `(3)` | `E1B3C16EA6027A1ED39DD2EFDBDAC141B5D5C8FC1803BEB8C91B2F8BBC41513E` | aspect-fill to 1920x1080, WebP q93 | `7965C816C6A0026A1FDFE4EC650E9E706B44E0FF9CBDE10C1F197EA4EB82AA9D` |

The generated inputs were produced for this Owner-requested prototype on
2026-09-03 using the approved Part 1 Manhwa and supplied art as continuity
references. They introduce no new written Canon facts.

## Rebuild

Run from the repository root:

```powershell
npx tsx tools/blender/run-blender.ts -- run-python --script artifacts/eleven-eleven/art/blender/scripts/build_part1_opening_anime_animatic.py -- --reference-dir artifacts/eleven-eleven/art/blender/reference/part-1-opening-anime --output artifacts/eleven-eleven/art/blender/source/part-1-opening-anime-animatic-v1.blend --preview-dir artifacts/eleven-eleven/.tmp/blender/part-1-opening-anime-animatic-v1/proofs
npx tsx tools/blender/run-blender.ts -- render-cinematic --blend artifacts/eleven-eleven/art/blender/source/part-1-opening-anime-animatic-v1.blend --output-dir artifacts/eleven-eleven/.tmp/blender/part-1-opening-anime-animatic-v1/frames --start 1 --end 960 --fps 24
npm run cinematic:encode -- --input artifacts/eleven-eleven/.tmp/blender/part-1-opening-anime-animatic-v1/frames/frame_%04d.png --output artifacts/eleven-eleven/public/assets/cinematics/promotional/echo-network-part1-opening-anime-animatic-v1.webm --fps 24 --force
```

After encoding, extract the poster from the signal-closeup beat, validate with
FFprobe and `npm run media:validate`, and visually inspect a contact sheet. Do
not add this prototype to runtime data until the Owner approves the shot design
and the integration accessibility/performance gate passes.
