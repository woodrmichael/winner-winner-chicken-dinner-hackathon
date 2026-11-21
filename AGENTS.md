# Working on ComForce Connect

Pick any ready ticket from the [product backlog](docs/tasks.md). Check its dependencies, claim its ID with your name or branch, and use its acceptance example to verify the change. After it lands, pick another ticket from any section.

- Keep routes in `app/` thin. Put screens and feature-specific logic in `src/features/`. Shared components live in `src/ui/`.
- Call `useDemo().run(command)` for writes. Read the [architecture](docs/architecture.md) before changing a command, persistence or a metric. Coordinate shared contract changes with anyone working on a dependent ticket.
- Build screens from the [shared UI components](docs/architecture.md#shared-ui). Reuse the existing control for the same interaction across features. Keep a one-off layout inside its feature until another screen needs it.
- Install Expo-compatible native dependencies with `npx expo install` and include the resulting lockfile change.
- Run `npm run check` and `npm run export:web` before handoff. For touch or layout changes, include the device and result from the [phone check](docs/mobile.md) in the PR.
- When work lands, mark the task complete and link its PR or commit on the board. Update architecture or setup docs when the contract or command they describe changes.
