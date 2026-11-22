# Architecture

Each feature shares one Expo Router app. The device-local workspace supports resident and organization profiles on one installation. Both workspace modes use the [workspace model](../src/shared/workspaceModel.ts) to authorize commands and project Activity, conversations, volunteering and reporting by account. With `EXPO_PUBLIC_API_URL` set, the app sends commands to the shared server and uses signed-in accounts. A referral represents one resident request. It contains partner assignments, requested categories and deliveries credited to the partner that provided each service.

The partner directory lives on the workspace as `partners` (seeded from [directory helpers](../src/features/matching/directory.ts)). Each partner record includes services, coverage areas, pickup arrangements, per-service availability, and listing status. The local workspace persists Community and Activity on one device. In the shared workspace, public posts and authorized referrals are available across devices.

| Change | Start here |
| --- | --- |
| Screen or navigation | [Routes and layout](../app/) delegate to [feature screens](../src/features/). Reuse the [UI components](../src/ui/). |
| Matching or directory coverage | [Request interpretation](../src/features/matching/llm/) uses request text and service rules to identify needs, draft a referral and ask a clarifying question when needed. [Matching](../src/features/matching/modelMatch.ts) ranks approved partners by service coverage, current availability and preferred neighborhood. When the request spans multiple specialties, Ask surfaces complementary partners. Residents can edit the needs, review a suggested draft or select an organization directly. The directory, matching and map read the same partner records. |
| Referral lifecycle | [Types and commands](../src/domain/types.ts) define the contract. [Referral model](../src/domain/referrals.ts) implements transitions and private read functions. [Domain model](../src/domain/model.ts) exposes aggregate reads. |
| Save, load or reset | [Provider](../src/state/Demo.tsx) queues writes. [Decoder](../src/state/persistence.ts) validates saved state. [Seed](../src/domain/seed.ts) defines the starting workspace. |

## Requests and event details

The partner inbox projects assignments into New, In progress and History and supports team and personal scopes. Resident and partner request pages put the timeline and private messages in one scroll view. A message notification opens the relevant assignment and scrolls to the thread. Partner actions use assignment IDs and remain attached to the current timeline step.

The main Milwaukee map uses MapLibre. The event detail card loads a bundled preview for its venue and shows its address and data credits. Reopening an event uses the same preview image.

### Request transcription

In Expo Go, the mic streams mono PCM through the shared workspace API to OpenAI Realtime when the server has an `OPENAI_API_KEY`. The server issues short-lived, single-use WebSocket tickets to signed-in residents and keeps the provider key in its environment. Requests have a time limit. The app puts partial and final transcripts in the editable request field. Microphone audio is forwarded and does not enter workspace storage. In browsers with speech recognition, the mic uses the browser service.

## Business partnerships

Community event details and the Impact program open project partnerships. Offers and inquiries can be submitted by any signed-in account. The winter organizer reviews private inquiries and offers, confirms support, and records pledges and payments. In the local workspace, switch to the Partner profile in Settings for coordinator actions.

Partnership commands store amounts in integer cents. A confirmed offer becomes one pledge with the offer ID. Payments reference that pledge and cannot exceed its outstanding balance. Partial payments are allocated proportionally across supplies and operations, rounded on cumulative receipts. Business volunteer commitments count toward project staffing separately from individual role reservations and attended hours. Existing winter funding opens with Juniper Market’s recorded balance. Its original purpose is unknown and reported separately from allocated receipts. Earlier device and server snapshots need no migration to display it.

The meal-kit project uses the existing pantry event, a $1,000 goal and optional program attribution on Neighborhood Table food deliveries. Winter clothing deliveries retain their existing program option. Shared summaries expose counts and provider credit by project.

Only confirmed support is published in the shared projection. Delivery credit comes from the existing program service records. The business summary uses public project information, funding and aggregate provider credit.

The authenticated coordinator creates hosted Checkout links through [the sponsorship payment service](../server/sponsor-payments.ts). An active link reserves its amount in the workspace. The signed Stripe webhook updates the reservation and receipt together in one save. Workspace snapshots expose active amounts to the coordinator, and published funding views read the existing payment ledger. [Sponsorship setup](sponsorships.md)

## Worker notes and responsibility

The delivery form optionally suggests one eligible completed service from a worker note using conservative completion phrases. Notes and suggestions stay on the device until review. Only the existing complete command records the selected category, provider and optional program. Keyboard dictation can fill the note field.

In shared mode, assign-worker targets an accepted open assignment. The server requires an approved colleague at the same organization and validates the selected worker against current approved membership. It derives the worker name from the account and stores assignedWorker on the assignment. Reassignment changes responsibility only. Older records default to unassigned. Workers see their own organization's approved roster and can filter the inbox to Assigned to me. Organization access and referral delivery authorization continue to use membership.

## Shared UI

Use system typography, neutral surfaces and one teal accent. Give each screen a clear title and keep text that helps someone decide, act or understand a result.

| Building a… | Use |
| --- | --- |
| Screen, card, form or action | [Page, Columns, Card, Copy, Field and Btn](../src/ui/kit.tsx). Use `Page.right` for desktop header actions that can sit below the heading on phones. Use `Page.mobileRight` for a compact phone action in the heading. `Btn` handles pending presses and errors. |
| Short set of mutually exclusive views | [Segments](../src/ui/Segments.tsx), as used for Community filters and the role selectors in Settings. |
| List with one selection or independent on/off settings | [SelectionRow and ToggleRow](../src/ui/SelectionRows.tsx). Use a selection row for a partner, and a switch for consent, program inclusion or a map layer. |
| Compact filter whose options should float over the screen | [SelectMenu](../src/ui/SelectMenu.tsx), as used for reporting period and provider in Impact and service category on the map. |
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
- AsyncStorage uses the existing key `comforce-connect/demo/v1`. The v2 decoder upgrades v1 records to one original assignment and preserves every old delivery. Older snapshots keep saved offers, referrals and bookmarks under Alex’s profile. Local messages, unread updates, volunteer roles and signups are saved alongside those records. Settings switches the active profile for the session. Each launch opens as Alex.
- The [demo seed](../src/domain/seed.ts) supplies deterministic August–November 2026 requests and deliveries. The [community seed](../src/domain/demoCommunity.ts) pairs sample event posts with their details. On load, missing samples are added by ID so existing device and shared workspaces keep their saved records. On the shared server, Alex’s sample referrals belong to the `alex` account.

### Shared account and volunteer contracts

- [The workspace API](../server/api.ts) authenticates each request with a session token. `GET /workspace` returns the active account, its authorized referrals or organization assignments, and separate public reporting projections. [Workspace access checks](../src/shared/workspaceModel.ts) run on every command and use the current membership, so approval reaches an already signed-in worker on the next refresh.
- `request-membership` opens a pending worker membership. `approve-membership` requires an administrator from the requested organization. Referral consent uses the resident account’s profile fields and the selections reviewed for that recipient.
- `set-service-availability` pauses or reopens one service for an organization. Organization administrators, ComForce moderators, or the offline Partner role for that inbox can change it. Accepted referrals stay in Activity. Residents see paused services as temporarily paused on Ask, the directory, and the profile. `submit-partner-listing` adds a pending organization from any signed-in account. `approve-partner-listing` requires a ComForce moderator and makes the listing visible for residents, matching, and map resources. `decline-partner-listing` clears the listing from the review queue and keeps it out of the resident directory; an optional reason is stored on the declined partner. `update-partner-listing` lets an organization administrator or a ComForce moderator revise a listing’s name, services, coverage, and pickup; accepted referrals stay in Activity. `delete-partner-listing` lets a ComForce moderator remove an organization from the resident directory and map resources while matching stops suggesting it. Accepted referrals stay in Activity, and Impact still credits deliveries to that provider.
- `reserve-volunteer` creates one signup per account for the winter drive. `cancel-volunteer` releases the place before attendance is recorded. Capacity checks and saves happen against the same server state. `update-volunteer-role` and `record-attendance` require the winter organizer. Pending attendance has no minutes, a no-show has zero, and a participant has positive confirmed minutes. The project summary counts signups, positive attendance and total minutes from those same records.
- `send-referral-message` targets one assignment. Only the resident who owns the referral and approved workers at that assignment’s organization can read or reply. The server records sender and time. It shows the resident’s first name only when shared with that organization. A handoff starts a separate conversation for the new assignment.
- Sending, accepting, proposing a handoff and replying create Activity updates for the relevant recipient. `mark-activity-read` records the signed-in account that opened the update. Reading it leaves it unread for colleagues, and the state persists across sessions. Older shared workspaces start with empty conversations and updates.

## Read from the same records

| View | Contract |
| --- | --- |
| Community | The public board shows public posts. My groups shows posts from joined neighborhoods. Saved shows bookmarked posts the resident can currently see. Leaving a group hides its posts from My groups and Saved until the resident rejoins. Search filters titles and descriptions within the selected Community view. Offer authors can edit or fulfill their own posts without changing referrals or delivery metrics. Residents can report posts; a moderator can review reports and hide a post while preserving the post and private referrals. Private referrals appear in Activity. |
| Activity | `residentTimeline` selects the resident’s referrals and their assignment history. `partnerInbox` includes only the selected partner’s assignments and their private fields. The original partner sees outstanding categories and delivery attribution for the coordinated request. |
| Impact | [`impactReport`](../src/features/impact/report.ts) counts one received request per referral, one open referral per request with outstanding needs, and one delivery per service record. Provider, program and period breakdowns use those same service records. The share summary uses the same aggregates. Program funding is shown to date, with received funds and outstanding pledges listed separately. |
| Map | `mapRows` counts each outstanding category and each recorded delivery under the first neighborhood the resident shared on the referral. A referral without a shared neighborhood still contributes to overall impact. Resources count approved directory partners whose primary area matches the neighborhood. Incident layers use a separately dated [historical series](sources.md). |

### Counting rules for 4.3 and 5.2

The shared server computes monthly and provider reports from its full workspace. Clients receive aggregates and program history with category, date and provider. Private referrals stay scoped to the signed-in account.

Approved organization workers receive only their provider’s service-record projection. Each record preserves its original delivery fields and append-only correction history. Category corrections update the active category; void corrections mark the record voided and exclude it from delivery, program, map and Impact calculations. Voiding restores an outstanding need only when the category is still requested and no other active delivery satisfies it.

The map's optional service category filters open needs and completed services in the neighborhood totals. The shared API provides the same per-category totals without sending private referral records to the map. Directory resources and historical observations keep their neighborhood totals.

The app shell keeps all four primary tabs mounted after their first visit. Inactive panes stay out of touch and accessibility navigation while their images, scroll views and map camera remain mounted. Detail pages use the routed slot. The persistent mobile navigation uses the app mark for Community, and the desktop sidebar carries the brand.

The Settings drawer shares its controls with the direct Settings route. A right-edge swipe or a long press on the Community tab opens it on phones. The desktop wordmark and Alt+Shift+S on web provide alternate entry points. Opening the drawer keeps the current route mounted.

The street map uses MapLibre in an Expo DOM component hosted by `react-native-webview` on phones. It keeps its camera, selection and overlays when another tab is active. All 190 City neighborhood boundaries are bundled for browsing. Open needs use polygon fill, homicides use outlines, and nonfatal shootings use dots. Each overlay has its own switch. OpenFreeMap serves the basemap tiles, and neighborhood stats remain available if the basemap fails to load.

`GET /public/map/libraries` serves validated public library names, addresses and coordinates. It uses an on-demand 24-hour cache, coalesces refreshes and keeps the last valid data when the City feed is unavailable. The map also keeps a public-only device cache and can reach the City feed in a local workspace. Shared service totals come from the authenticated workspace and use a cached projection until referrals change. Preview fixtures are documented in the demo setup.

Workspace polling pauses in the background and resumes on return. The client keeps the latest authenticated snapshot in memory and sends its session-scoped `ETag` with each subsequent poll. The server returns `304` when the workspace revision and reporting month match. Session changes clear the validator, and workspace responses specify `no-store` for browser and intermediary caches.

Event details and the Community events overlay use the same public venue metadata. The overlay derives pins from visible public Event posts with known venues. Hidden posts and group posts are excluded, and event addresses do not come from referrals.

The service map supports 26 reporting neighborhoods. The service category filters open need and delivery totals within that coverage. The mobile overview identifies the selected area, the all-time reporting window and the two service metrics. Community groups keep their own directory.

- For 4.3, use `outstandingNeeds(referral)` for the category breakdown. A provider decline or handoff leaves the category outstanding. Recording a service or withdrawing a category removes it. A request without detected categories counts as Other until resolved.
- For 5.2, use `referral.sentAt` for requests received and `service.deliveredAt` for deliveries. Filter delivery breakdowns by `service.providerId` and use the Milwaukee calendar for month boundaries. Handoffs, declines, withdrawals and appointments never add requests or deliveries.
- Open and response counts describe the current status of referrals submitted in the selected period, across all providers. Response time runs from submission to the earliest acceptance across assignments. Open referrals without an acceptance count as awaiting and stay out of the median. The provider filter applies to delivery totals and breakdowns on screen and in the share summary.
- Residents assisted counts distinct resident IDs with at least one delivery matching the period and provider. The Winter essentials page opened from Recent work shows all program deliveries in the selected period.

The [workflow tests](../tests/workflow.test.ts) exercise these contracts through sending, acceptance, completion, reload and reset. Extend the relevant scenario when a change affects more than one screen.
