# Architecture

Each feature shares one Expo Router app and one device-local workspace. The unit of work is a referral to one partner. Recording a completed service closes that referral and attributes delivery to that partner.

| Change | Start here |
| --- | --- |
| Screen or navigation | [Routes and layout](../app/) delegate to [feature screens](../src/features/). Reuse the [UI components](../src/ui/). |
| Matching or directory coverage | [Matcher](../src/features/matching/match.ts) returns detected needs and partners ranked by number of needs covered. Directory order breaks ties. The resident reviews the result and can choose a partner manually. |
| Record shape or lifecycle | [Types and commands](../src/domain/types.ts) define the contract. [Domain model](../src/domain/model.ts) implements transitions and read functions. |
| Save, load or reset | [Provider](../src/state/Demo.tsx) queues writes. [Decoder](../src/state/persistence.ts) validates saved state. [Seed](../src/domain/seed.ts) defines the starting workspace. |

## Shared UI

Use system typography, neutral surfaces and one teal accent. Give each screen a clear title and keep text that helps someone decide, act or understand a result.

| Building a… | Use |
| --- | --- |
| Screen, card, form or action | [Page, Columns, Card, Copy, Field and Btn](../src/ui/kit.tsx). Pass header actions through `Page.right` for phone and desktop placement. `Btn` handles pending presses and errors. |
| Short set of mutually exclusive views | [Segments](../src/ui/Segments.tsx), as used for Community filters and Activity roles. |
| List with one selection or independent on/off settings | [SelectionRow and ToggleRow](../src/ui/SelectionRows.tsx). Use a selection row for a partner, and a switch for consent, program inclusion or a map layer. |
| Proportion with a visible number | `ProgressBar` in the UI kit. The calling screen supplies the label, value and total. |

## Follow a write

A screen supplies an ID and timestamp, then awaits `run(command)`. The provider applies the command to the latest committed state, saves the resulting snapshot, then publishes it to subscribers. If saving fails, the caller receives the error and the previous state remains visible.

- `post` adds a public offer or posts an update to a neighborhood group the resident has joined. `reply` saves a public offer reply. `event-rsvp` and `group-membership` set the resident’s signup and membership. The offer thread lets the demo switch between the resident and the offer author on one device.
- `send` creates a private referral containing the reviewed message, selected partner and chosen contact fields.
- `accept` records the assigned partner’s acceptance. `complete` requires that acceptance and a category the partner delivers. Repeating either transition preserves the original timestamp and service.
- AsyncStorage holds a versioned snapshot at `comforce-connect/demo/v1`. Earlier v1 snapshots load with empty replies, event signups and group memberships. Role, partner selection and unsent drafts are session state. When changing the persisted shape, update the decoder and test loading a snapshot written by the previous version.

## Read from the same records

| View | Contract |
| --- | --- |
| Community | The public board shows public posts. My groups shows posts from joined neighborhoods. Leaving a group hides its posts from that feed until the resident rejoins. A private referral appears in Activity. |
| Activity | `residentTimeline` selects the resident’s referrals. `partnerInbox` selects the receiving partner’s referrals and omits the internal resident ID. |
| Impact | `impact` counts received referrals, open referrals without a service, and delivered services by category and provider. The winter program counts eligible clothing deliveries explicitly linked to it. Received funds and pledges are independent amounts. |
| Map | `mapRows` groups open needs and deliveries by shared neighborhood. A referral without a shared neighborhood still contributes to overall impact. Resources come from the directory. Incident layers use a separately dated [historical series](sources.md). |

The [workflow tests](../tests/workflow.test.ts) exercise these contracts through sending, acceptance, completion, reload and reset. Extend the relevant scenario when a change affects more than one screen.
