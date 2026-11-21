# Architecture

Each feature shares one Expo Router app and one device-local workspace. A referral represents one resident request. It contains partner assignments, requested categories and deliveries credited to the partner that provided each service.

The [demo directory](../src/features/matching/directory.ts) contains sample provider records. Referrals sent in the demo appear in Activity on the same device.

| Change | Start here |
| --- | --- |
| Screen or navigation | [Routes and layout](../app/) delegate to [feature screens](../src/features/). Reuse the [UI components](../src/ui/). |
| Matching or directory coverage | [Matcher](../src/features/matching/match.ts) returns detected needs and partners ranked by number of needs covered. Directory order breaks ties. The resident reviews the result and can choose a partner manually. |
| Referral lifecycle | [Types and commands](../src/domain/types.ts) define the contract. [Referral model](../src/domain/referrals.ts) implements transitions and private read functions. [Domain model](../src/domain/model.ts) exposes aggregate reads. |
| Save, load or reset | [Provider](../src/state/Demo.tsx) queues writes. [Decoder](../src/state/persistence.ts) validates saved state. [Seed](../src/domain/seed.ts) defines the starting workspace. |

## Shared UI

Use system typography, neutral surfaces and one teal accent. Give each screen a clear title and keep text that helps someone decide, act or understand a result.

| Building a… | Use |
| --- | --- |
| Screen, card, form or action | [Page, Columns, Card, Copy, Field and Btn](../src/ui/kit.tsx). Pass header actions through `Page.right` for phone and desktop placement. `Btn` handles pending presses and errors. |
| Short set of mutually exclusive views | [Segments](../src/ui/Segments.tsx), as used for Community filters and the role selectors in Settings. |
| List with one selection or independent on/off settings | [SelectionRow and ToggleRow](../src/ui/SelectionRows.tsx). Use a selection row for a partner, and a switch for consent, program inclusion or a map layer. |
| Compact summary that opens more details | [Disclosure](../src/ui/Disclosure.tsx), as used for the recipient picker, sharing options and partner inbox. |
| Resident referral consent | [ShareDetails](../src/features/matching/ShareDetails.tsx) displays the same opt-in fields when sending a request or approving a new recipient. Each recipient starts with every field off. |
| Proportion with a visible number | `ProgressBar` in the UI kit. The calling screen supplies the label, value and total. |

## Follow a write

A screen supplies an ID and timestamp, then awaits `run(command)`. The provider applies the command to the latest committed state, saves the resulting snapshot, then publishes it to subscribers. If saving fails, the caller receives the error and the previous state remains visible.

- `post` adds a public offer or posts an update to a neighborhood group the resident has joined. `reply` saves a public offer reply. `event-rsvp` and `group-membership` set the resident’s signup and membership.
- `save-post` saves or removes a bookmark for a Community post. A repeated command with the same desired state makes no change.
- `send` creates a referral and its original assignment. Partner commands target an **assignment ID**. The original assignment uses the referral ID. Resident commands target the **referral ID**.
- `accept` records that assignment’s first acceptance. `schedule` saves or revises one pickup or visit for an accepted assignment with actionable needs. Appointment date and time are Milwaukee wall time.
- `propose-handoff` gives the resident a proposed recipient, category and reason. `respond-handoff` can create one assignment for that category. The recipient gets the reviewed reason and freshly opted-in fields. The original message and contact details stay with the original assignment.
- `decline-service` records a provider’s reason for a category. The resident can use `seek-provider` to send a reviewed message to another provider or `withdraw-need` to close that category.
- `complete` requires acceptance and an outstanding category the assignment handles. Each delivery stores its category, assignment, provider, time and optional program. Repeating acceptance, approval or delivery preserves the original record.
- AsyncStorage uses the existing key `comforce-connect/demo/v1`. The v2 decoder upgrades v1 records to one original assignment and preserves every old delivery. A requested category without a delivery stays open after migration. Older snapshots without community state or bookmarks load with empty defaults for those fields. Settings holds the referral view, partner inbox and offer reply identity for the session. Unsent drafts are session state.

## Read from the same records

| View | Contract |
| --- | --- |
| Community | The public board shows public posts. My groups shows posts from joined neighborhoods. Saved shows bookmarked posts the resident can currently see. Leaving a group hides its posts from My groups and Saved until the resident rejoins. Search filters titles and descriptions within the selected Community view. Private referrals appear in Activity. |
| Activity | `residentTimeline` selects the resident’s referrals and their assignment history. `partnerInbox` includes only the selected partner’s assignments and their private fields. The original partner sees outstanding categories and delivery attribution for the coordinated request. |
| Impact | `impact` counts one received request per referral, one open referral per request with outstanding needs, and one delivery per service record. `deliveredServices` supplies the records for provider, program and period breakdowns. Received funds and pledges are independent amounts. |
| Map | `mapRows` counts each outstanding category and each recorded delivery under the first neighborhood the resident shared on the referral. A referral without a shared neighborhood still contributes to overall impact. Resources come from the directory. Incident layers use a separately dated [historical series](sources.md). |

### Counting rules for 4.3 and 5.2

- For 4.3, use `outstandingNeeds(referral)` for the category breakdown. A provider decline or handoff leaves the category outstanding. Recording a service or withdrawing a category removes it. A request without detected categories counts as Other until resolved.
- For 5.2, use `referral.sentAt` for requests received and `service.deliveredAt` for deliveries. Filter delivery breakdowns by `service.providerId` and use the Milwaukee calendar for month boundaries. Handoffs, declines, withdrawals and appointments never add requests or deliveries.

The [workflow tests](../tests/workflow.test.ts) exercise these contracts through sending, acceptance, completion, reload and reset. Extend the relevant scenario when a change affects more than one screen.
