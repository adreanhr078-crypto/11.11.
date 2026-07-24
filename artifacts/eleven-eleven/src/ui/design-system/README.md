# 11:11 Cinematic Game Design System

This package is the presentation foundation for the Android-first landscape
game UI. It contains no game rules and does not import the game store.

## Runtime contract

- `GameViewport` owns quality, motion, orientation and Android safe-area data.
- `GameSafeArea` keeps interactive HUD controls clear of cutouts and system
  navigation areas.
- Cinematic media uses `object-fit: cover` with an authored focal point so
  characters are never stretched.
- All interactive primitives meet the coarse-pointer touch target.
- Components accept data and callbacks. Application commands remain outside
  the design system.

## Tones

- `danger`: emotional danger, corruption and critical choices
- `memory`: memory, technology and stability
- `rare`: exceptional phenomena and rare resources
- `progression`: achievements, chapter progress and rewards
- `success`: confirmed positive outcomes
- `neutral`: structure and secondary information

## Performance

The design system uses transform/opacity motion and CSS effects. Set
`data-gds-quality="mobile"` to reduce blur and shadow cost. Set
`data-gds-motion="reduced"` or respect the operating-system reduced-motion
preference to disable decorative movement.

Screen composition, routing, lazy loading and application read models belong
to the later application-shell phase.
