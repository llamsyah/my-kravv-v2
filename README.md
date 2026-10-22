# MY KRAVV

V3 Slice 0 development is active on `v3`: an isolated local environment and a minimal security demonstration, with later product features unavailable. Start with the [Slice 0 operating guide](supabase/v3/README.md), [implementation evidence](docs/v3/SLICE-0-IMPLEMENTATION-NOTES.md), [V3 documentation authority](docs/v3/00-V3-INDEX.md) and [V3 design workspace](design/v3/README.md). The historical V2 checkpoint remains on `main`.

The separate [Cloud bootstrap Checkpoint 2C](supabase/v3-cloud/README.md) is offline preparation only: owner-approved target identity, review-only SQL artifacts, denial-only Cloud commands, and no remote operations. It does not unblock local startup or authorize hosted access.

## Where to start

- [Documentation gateway](docs/README.md): active V3 documents and historical V2 knowledge.
- [V3 visual reference index](design/v3/references/README.md): all 14 canonical PNGs are present, with known exceptions; conceptual images do not prove implementation or accept the new Draft specifications.
- [V3 explorations](design/v3/explorations/README.md): unapproved concepts only.
- [V2 documentation archive](docs/archive-v2/README.md) and [V2 visual archive](design/archive-v2/README.md): historical evidence, without authority over approved V3 decisions.
- [V2 checkpoint](CHECKPOINT-V2.md): dated implementation boundary and historical validation.

## Run the isolated V3 foundation

Use Node.js 24 LTS (see [.node-version](.node-version)) and npm:

```sh
npm ci
npm run v3:up
npm run v3:doctor
npm run dev
```

Open <http://127.0.0.1:3103>. Follow the operating guide before startup. Existing V2 local environment files stay intact; guarded commands replace their values only in child-process memory. Do not copy V2 credentials into a V3 environment. Registration is disabled; validation creates and removes marked synthetic accounts.

The root [Supabase setup](supabase/README.md), [server boundary](src/server/README.md), and [AI setup](src/server/ai/README.md) describe retained V2 code. V3 uses only the nested configuration and migration in `supabase/v3/`. Legacy application paths and real AI calls are disabled in Slice 0.

## Local validation

```sh
npm run check
npm run build
npm start
```

The check runs lint, type generation/TypeScript, formatting and deterministic tests. Build/start additionally require the positively identified local V3 stack. Documentation is excluded from the root formatter. Use only `npm run v3:test` for the authorized isolated integration suite with the V3 app running. Retained V2 live tests and AI smoke commands are historical and must not be run for Slice 0.

Disposable screenshots, measurements, logs and generated QA reports belong in ignored `.qa/<task>/`. Promote only deliberately selected, documented evidence into design archives or explicitly approved references. Never write automated captures into `design/v3/references/`.

## Implementation history

The complete prior root README is preserved as the [historical V2 developer guide](docs/archive-v2/developer-guide-v2.md), including its original milestone descriptions, limitations and instructions. Its next-milestone guidance is historical. For the implemented boundary use the checkpoint, dated reports, source and tests together. Follow [AGENTS.md](AGENTS.md) and installed Next.js guides for engineering work.
