---
name: 11.11-player-experience-loop
description: Keep every 11.11 change visually premium, understandable, connected to the playable core loop, and proven in Edge before delivery. Use for any player-facing, gameplay, reward, story, platform, or milestone change.
---

# 11.11 Player Experience Loop

Use this as the permanent product-director loop for 11.11. The target is an
emotionally engaging game—not a collection of polished screens. Run it before
and after every in-scope change, and before closing any milestone.

## Non-negotiable player test

Trace the affected journey in this order whenever it applies:

`Login → First contact → Echo → clear objective → Manhwa/Story → puzzle or
meaningful play → authoritative result → visual/audio response → Echo reaction
→ next objective → return reason`

A change may pass only when a first-time player can answer, without developer
help:

1. What do I do now?
2. Why does it matter in this world?
3. How does it work?
4. What changed after I acted?
5. What is my meaningful next step?

If a relevant answer is absent, confusing, or only present in hidden text,
repair the smallest safe part of the route before delivery.

## Before changing code or assets

- Inspect the actual route, rendering path, store/API/reward boundary, current
  tests, mobile styles, and existing 11.11 tokens. Do not create a parallel UI
  system or a disconnected demo flow.
- Classify the visual need deliberately: React/CSS for live controls; 2.5D for
  bounded atmosphere; Blender-rendered media only for a proven high-value
  character/cinematic moment; GLB only where interaction needs depth. Reject
  heavier media when it slows first play or offers no interaction value.
- For any UI or visual work, also apply `$11-11-ui`; preserve semantic text,
  focus, touch reachability, RTL/LTR, mute, volume, and Reduced Motion.
- Keep all rewards, ratings, progression, and completion claims at their
  authoritative server boundary. Presentation reacts to receipts; it never
  grants, retries blindly, or duplicates them.

## Design contract

- Preserve the 11.11 language: obsidian structure, restrained signal crimson,
  cyan signal, pale information hierarchy, material depth, and readable live
  UI. Never put essential text or state inside decorative art.
- Give each screen one visible primary action and an intentional loading,
  empty, error, offline, and retry state when applicable.
- Use purposeful feedback at entry, interaction, success, failure, reward, and
  Echo moments. Failure should encourage and teach without revealing answers.
- Design for attachment and mastery, never coercion: no fake scarcity, streak
  punishment, spam, deceptive urgency, or reward farming incentives.
- Budget every asset. Use responsive/lazy loading, reserve layout space, retain
  a lightweight fallback, and measure actual loaded resources where possible.

## Prove the result in Edge

Use Microsoft Edge—not Chrome—for runtime evidence. At the affected routes,
verify desktop landscape and phone portrait; add landscape when the feature can
appear there. Verify Arabic RTL and English LTR when localized, keyboard focus,
touch targets, reduced motion, mute/volume, loading/error states, refresh, and
the relevant successful and rejected actions. Inspect console errors and failed
network requests.

Record actual runtime observations separately from source/tests. Static bundle
sizes do not prove Core Web Vitals. Do not call LCP, INP, CLS, remote auth,
multi-client recovery, or production behavior verified without direct evidence.

## Exit gate

1. Run `$11.11-autonomous-quality-gate` fully.
2. Self-critique as player, UX director, game designer, performance engineer,
   and integrity reviewer; repair every safe, evidenced defect.
3. Re-run affected tests and runtime checks after repairs.
4. Review the complete diff for Canon, auth, persistence, reward authority,
   accessibility, assets, and accidental generated files.

Use `PASS` only with implementation, verification, and the five player answers
all evidenced. Use `PARTIAL` or `UNVERIFIED` for missing external/runtime proof;
do not hide it behind polished visuals.
