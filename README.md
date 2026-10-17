# MY KRAVV

V3 preparation is active on `v3`. Start with the [V3 documentation authority](docs/v3/00-V3-INDEX.md) and [V3 design workspace](design/v3/README.md). The running application remains the V2 checkpoint at Milestone 5.5 Phase 4B; final V2 Phase 4B visual approval is still pending. This reorganization implements no V3 features.

## Where to start

- [Documentation gateway](docs/README.md): active V3 documents and historical V2 knowledge.
- [V3 approved reference index](design/v3/references/README.md): Hybrid C direction; Home image is `AWAITING_OWNER_ASSET`.
- [V3 explorations](design/v3/explorations/README.md): unapproved concepts only.
- [V2 documentation archive](docs/archive-v2/README.md) and [V2 visual archive](design/archive-v2/README.md): historical evidence, without authority over approved V3 decisions.
- [V2 checkpoint](CHECKPOINT-V2.md): dated implementation boundary and historical validation.

## Run the existing application

Use Node.js 24 LTS (see [.node-version](.node-version)) and npm:

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. The current application uses the existing Supabase authentication and Company/Thought/Refine workflows. Keep existing local configuration intact. For a fresh checkout only, copy [.env.example](.env.example) to `.env.local` and configure the designated development project; never commit secrets.

Read [Supabase setup](supabase/README.md), the [server boundary](src/server/README.md), and [AI setup](src/server/ai/README.md) before environment or database work. Checked-in migrations do not prove remote state. This repository cleanup grants no authorization to apply migrations, modify live data, or make real AI requests.

## Local validation

```sh
npm run check
npm run build
npm start
```

The check runs lint, type generation/TypeScript, formatting and deterministic tests. Documentation is excluded from the root formatter and should be checked explicitly when edited. Live database tests and AI smoke tests require separate authorization; do not run them as routine checks.

Disposable screenshots, measurements, logs and generated QA reports belong in ignored `.qa/<task>/`. Promote only deliberately selected, documented evidence into design archives or explicitly approved references. Never write automated captures into `design/v3/references/`.

## Implementation history

The complete prior root README is preserved as the [historical V2 developer guide](docs/archive-v2/developer-guide-v2.md), including its original milestone descriptions, limitations and instructions. Its next-milestone guidance is historical. For the implemented boundary use the checkpoint, dated reports, source and tests together. Follow [AGENTS.md](AGENTS.md) and installed Next.js guides for engineering work.
