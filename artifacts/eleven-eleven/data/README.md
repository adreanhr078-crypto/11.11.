# Data-Driven Content

Narrative content is authored in JSON files under this folder. TypeScript owns
the engines and validators; story content should be added by editing data files
and running `npm run validate:content`.

Current loaded indexes:

- `chapters/index.json`
- `puzzles/index.json`
- `memories/index.json`
- `dialogues/index.json`
- `endings/index.json`

Editor support:

- `schemas/narrative-content.schema.json` gives JSON Schema hints for shared
  condition and effect objects.
- The TypeScript validator checks IDs, graph links, references, and capacity.

Persistence rule:

Saves store player state, IDs, flags, and decisions. They do not store authored
content definitions, keeping thousands of future entries cheap to load and
migrate.

