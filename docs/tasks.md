# ComForce Connect backlog

**What to show the judges:** A family describes a need in its own words. The app suggests a Milwaukee partner and explains the fit. The resident approves the referral, a worker records what arrived, and ComForce can show a business what its contribution supported. The [founder’s organization](https://comforcemilwaukee.com/) and the [competition brief](https://msoe-maic.com/library/?nav=Competitions&article=HacksGiving-ComForce-MKE-2026) give context for that story.

## Pick any ready ticket

Anyone can claim any unchecked ticket whose dependencies have landed, then pick another across any section. Add your name or branch beside the ID when you start. When the acceptance example works, check the box and link the merged PR or commit. A ticket that touches a shared type should name that change in its PR so another person can build against it. Use the [shared UI and data contracts](architecture.md) throughout.

**Headline** tasks strengthen the judging story. **Next** tasks add useful workflows that can ship independently. **Later** tasks are available once the core story is reliable or when a team member has the necessary hardware, data or integration access. Topic headings help people find code; they assign no owners.

| Start here if you want to… | Ready now | What it unlocks |
| --- | --- | --- |
| Prove the AI actually helps | AI-EVAL or AI-MODEL | One person can freeze the benchmark while another gets real inference running. Combine them in AI-MATCH. |
| Bring a local business into the story | FUND-LEDGER | FUND-CAFE converts eligible drink sales into a pledge, then a receipt. |
| Give ComForce something to take away | OUT-REPORT | OUT-EXPORT turns recorded services and provider credit into a portable report. |
| Improve frontline coordination | REF-INBOX or REF-PICKUP | A worker can find an unanswered request or tell a resident when help is coming. |
| Make Milwaukee resources actionable | ORG-PROFILE or MAP-RESOURCES | Named resources replace bare counts and can lead into a reviewed request. |
| Build the community experience | SOC-EVENT or SOC-RESPOND | Residents can participate in a drive or respond to someone offering supplies. |
| Test what teammates merge | QA-IPHONE, QA-ANDROID or QA-INTEGRATE | Reproducible device evidence and a known-good presentation build. |

For the live segment, prioritize **AI-EVAL + AI-MODEL → AI-MATCH**, **FUND-LEDGER → FUND-CAFE**, and **OUT-REPORT → OUT-EXPORT**. They can progress in parallel. When ledger totals replace seed constants, keep the report projection as the common consumer. Keep advanced workflows on detail screens so the main tabs stay clear.

**Already shipped:** [community board, rules matcher, private handoff and service tracking](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/e8d981b), [interactive neighborhood selection](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ba0083c), and [provider attribution and program delivery history](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/cfcf87e). The tickets below extend these features. The model integration and campaign ledger are open work.

## AI for residents and frontline workers

Start in [matching](../src/features/matching/) and [partner Activity](../src/features/activity/Activity.tsx). The shipped matcher looks for words and ranks directory entries by the categories they cover. The first judging opportunity is to show a real model understanding a phrase those rules miss, with a resident still choosing what gets sent.

- [ ] **AI-EVAL · Measure the current matcher** — Headline, ready. Build labeled cases for mixed needs, negation, paraphrases, insufficient information and an unsupported request. Include “We have coats but no way to get to the pickup” and “I don’t need a ride anymore.” Reserve unseen examples from another teammate. Run the existing matcher first. Report category matches, acceptable top partners and false suggestions with numerators, denominators and concrete misses.

- [ ] **AI-MODEL · Run an actual local model end to end** — Headline, ready. Add an optional laptop-side adapter to a local Ollama model with schema-constrained output for need categories, supporting phrases and an optional clarification. Keep the model endpoint separate from Expo’s static export and retain the existing rules when unavailable. Pin the model tag and record its license, install command, observed latency and cost on the actual presentation laptop. Done when a novel utterance produces a validated real response, and a timeout or invalid response returns control to the rules path. [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)

- [ ] **AI-MATCH · Connect model output to directory-backed matches** — Headline, after AI-EVAL + AI-MODEL. Wire Find resources to the optional adapter. Rank existing partner IDs by supported needs and explain the fit using actual directory capabilities. Only use the reviewed request text for inference; contact fields are chosen separately. Exercise model-on and fallback behavior on web and Expo Go, including an unreachable laptop endpoint and an edit before an earlier response arrives. Compare both methods on the held-out cases; record where each wins or misses.

- [ ] **AI-DRAFT · Draft an editable referral** — Headline, after AI-MODEL. Turn the resident’s words into a short first-person referral. Preserve their facts and show the original beside the draft on demand. A resident can edit, use the draft, keep the original or choose another partner. Send only when they confirm. Verify the house-fire draft preserves the ride request and invents no address, eligibility or promised delivery.

- [ ] **AI-CLARIFY · Ask one question that changes the match** — Next, after AI-MATCH. For “I need help getting food,” distinguish pantry access from a ride to pickup when the answer would change the suggestion. Let the resident skip, answer or choose manually. Verify that a clear request takes no extra step and that an unsupported need does not produce an invented partner.

- [ ] **AI-NOTES · Turn worker notes into a proposed service record** — Next, after AI-MODEL. From an accepted referral, let a worker enter “Dropped off two coats; ride still needed.” Propose a supported service category and a reviewable note. Resolve the provider from the assigned partner. A draft, cancellation or model timeout leaves impact unchanged; confirming a valid delivery increments it once. Preserve the outstanding ride for the follow-up workflow when available.

- [ ] **AI-VOICE · Capture a field note by voice** — Later, after AI-NOTES. Offer voice input from the same worker form after proving microphone and transcription support on the intended phone. Show an editable transcript before drafting. Test permission denied, interrupted recording, cancel and typed fallback. Include observed transcription latency and where audio is processed in the handoff.

- [ ] **AI-FALLBACK · Improve matching when the model is offline** — Next, after AI-EVAL. Use errors from the baseline to improve negation and transportation vocabulary while keeping directory order as the stable tie-breaker. Test “I don’t have a ride” versus “I don’t need a ride.” Compare with the frozen baseline and send a zero-match request through manual selection.

## Service partners and referral coordination

The [directory](../src/features/matching/directory.ts) describes who can help; the [domain model](../src/domain/model.ts) records who actually did. Use the existing command path for changes that need to survive reload. These tickets make accepting, declining and sharing responsibility visible to the resident.

- [ ] **ORG-PROFILE · Make service partners discoverable** — Next, ready. Build a partner profile from a single directory entry with services offered, area served, intake instructions and date last reviewed. Populate the three existing entries and show an explicit unknown for missing availability. Confirm the map, matcher and profile agree on capabilities and that sponsorship does not influence ranking.

- [ ] **ORG-SOURCE · Curate Milwaukee resource listings people can verify** — Next, after ORG-PROFILE. Use organizations’ own published intake pages to add a small set of actual service listings with source, review date, area, eligibility and contact channel. Distinguish a publicly listed resource from an organization approved to receive in-app referrals. Test one of each: both can be discovered, and only the approved partner appears as an in-app recipient. Preserve retired IDs in recorded history.

- [ ] **ORG-VERIFY · Give ComForce a partner onboarding workflow** — Later, after ORG-PROFILE. Support a locally reviewable organization application, requested service categories and approved directory publication. A coordinator can approve or retire a listing. Verify pending organizations cannot receive new referrals, and retiring a listing preserves the provider’s name in past outcomes.

- [ ] **REF-INBOX · Surface the next referral that needs a worker** — Next, ready. Group the selected partner’s queue into waiting, in progress and completed. Order waiting work oldest first. Seed one of each, then accept the oldest and verify it moves groups immediately. Keep the resident timeline and other partners’ messages separate.

- [ ] **REF-PICKUP · Schedule the next step** — Next, ready. Let the assigned partner save or revise a pickup time and short note after acceptance. Show the plan in Milwaukee time in both private timelines. Test a snapshot without these fields, reload after a revision, and confirm scheduling alone leaves open and delivered counts unchanged.

- [ ] **REF-NEEDS · Track clothing and a ride independently** — Next, ready. The current referral closes on one delivery. Introduce per-need outcomes so clothing can be delivered while a ride remains open. Preserve legacy completed referrals and service attribution. Supply shared selectors and update map, impact and tests in the same change: one request, two needs, one clothing delivery, one open need; completing the ride later yields two services and zero open needs. Update the rehearsal expectations when this lands.

- [ ] **REF-HANDOFF · Hand an outstanding need to another partner** — Next, after REF-NEEDS. A worker proposes Riverwest Ride Circle for the remaining ride. The resident reviews the recipient and fields again. Only after approval should the receiving inbox gain the referral. Test decline, retry and acceptance. The clothing provider keeps its credit; the second provider only gets credit when it records the ride.

- [ ] **REF-DECLINE · Recover when a partner cannot help** — Next, ready. Add a capacity decline with a short resident-facing reason and a way to choose a different partner. Keep the original history; resending should reuse the underlying household request and require a fresh recipient review. Verify a decline counts as neither a service delivered nor a second request received.

- [ ] **REF-CONFIRM · Let residents confirm the outcome** — Later, after REF-NEEDS. After a worker records a service, offer “Received” or “I still need help.” Keep resident confirmation separate from provider documentation. A dispute opens follow-up without adding or deleting a delivery. Verify both views survive reload and an unrelated partner sees nothing new.

## Business partnerships and program funding

Start with the winter program in [seed data](../src/domain/seed.ts) and the merged [Impact screen](../src/features/impact/Impact.tsx). The original business idea was a neighborhood café funding a named program per sale. Prove exactly what was promised, received and delivered.

- [ ] **FUND-LEDGER · Track commitments and receipts** — Headline, ready. Replace ad hoc campaign totals with a small program ledger and derived balances. Preserve the starting $1,250 received and $300 still pledged when older state loads. Convert $100 of the existing pledge to a receipt: received becomes $1,350 and outstanding becomes $200. Retrying the same receipt keeps both totals stable. Service counts do not move.

- [ ] **FUND-CAFE · Demonstrate the café partnership** — Headline, after FUND-LEDGER. Create a named campaign with a business, beneficiary program, contribution per sale and campaign period. Log 35 eligible drinks at $1 each. Show $35 earned and outstanding until remittance; record receipt once, with no second credit to the goal. Open the campaign from its program page. Test a zero-sales day and a corrected sales entry.

- [ ] **FUND-INTEREST · Let a business express sponsorship interest** — Next, ready. Add a program-specific “Partner with this program” action with sponsorship type, proposed contribution and contact preference. A coordinator can review the inquiry locally. Submitting it changes neither funding totals nor the public sponsor list. Check cancellation and a second submission.

- [ ] **FUND-AGREEMENT · Turn an inquiry into a specific partnership** — Next, after FUND-INTEREST + FUND-LEDGER. Let the coordinator agree on a program, contribution and recognition preference. Acceptance creates one pledge; declining leaves the ledger unchanged. Use a fixture that wants public recognition and one that prefers anonymity. Verify that only the former appears on the program page.

- [ ] **FUND-USE · Show how program money is used** — Next, after FUND-LEDGER. Give the program an allocation breakdown for direct support and operating costs. Label budgeted and spent amounts separately. Reconcile a sample receipt with a recorded expenditure and a remaining balance. Keep funding progress independent of service delivery.

- [ ] **FUND-MATCH · Model employer matching** — Later, after FUND-LEDGER. Support an employer’s matching rate and cap. A $60 eligible contribution against a remaining $40 match cap accrues $40 outstanding. The second transaction cannot spend the cap again. Record employer payment separately from the original contribution.

- [ ] **FUND-VOLUNTEER · Support a business volunteer day** — Later, after SOC-RSVP + FUND-AGREEMENT. Link a sponsoring business to an outreach event with volunteer slots. Show sponsorship, signups and actual attendance separately in the program recap. Canceling an RSVP frees a slot without changing the sponsor’s contribution.

- [ ] **FUND-RECOGNITION · Recognize a sponsor where its contribution belongs** — Next, after FUND-AGREEMENT. Show the consenting sponsor on the supported program and relevant public event or update. Link recognition back to the program report. Test two programs with different sponsors and an anonymous business. Switching sponsors must leave the same resident message, partner ranking and intake eligibility unchanged.

## Community, groups and volunteering

Start with the existing [public board and offer composer](../src/features/community/). Give residents something worth coming back for between requests for assistance. Keep posting publicly and privately contacting a partner as distinct actions.

- [ ] **SOC-EVENT · Open an event from the feed** — Next, ready. Move host, venue and start time out of the hard-coded drive card into event metadata. Opening the drive should show where to go, when, what to bring and who is organizing it. Add a second event at a different venue and verify both render correctly without matching post IDs in the UI.

- [ ] **SOC-RSVP · Join or cancel a volunteer shift** — Next, after SOC-EVENT. Persist membership by event and resident. Support join, reload and cancel from the details page and show joined status in the feed. Replaying a join cannot count twice. Older snapshots start with no signups. An RSVP leaves assistance totals unchanged.

- [ ] **SOC-GROUP · Join a neighborhood group** — Next, ready. Add a small group directory, membership and a My groups feed. Preserve the existing public board and give older public posts a citywide audience. Join Riverwest, post an offer there, leave, and verify the group filter changes immediately. Private referrals must never appear in either feed.

- [ ] **SOC-POST · Compose the post that matches the situation** — Next, after SOC-GROUP. Extend public composition beyond offers to community updates and public requests for supplies. Show audience and content on a preview before publishing. Offer the private Ask flow separately. Saving an update in a group must not dispatch a referral or copy selected contact fields into the post.

- [ ] **SOC-RESPOND · Respond to a public offer** — Next, ready. Allow a resident to express interest in an offer and its author to mark the item claimed or available again. Verify a claimed coat cannot be claimed twice and the original post remains readable. Keep interest, pickup and documented partner service as separate events.

- [ ] **SOC-MODERATE · Give group organizers a moderation queue** — Later, after SOC-POST. Allow a post to be reported, reviewed and hidden from public readers, with an option to restore it. Keep the reporting resident out of public post details. Verify reporting the same post twice does not multiply open cases and hiding it does not alter referral history.

## Neighborhood map and resource discovery

The merged [map](../src/features/map/MapScreen.tsx) already links a selected neighborhood to its totals. Build outward from that selection. Keep published historical incident counts visually and statistically separate from current ComForce activity.

- [ ] **MAP-RESOURCES · Turn a resource count into a useful list** — Next, ready. Read names and service categories from the existing directory for the selected neighborhood when Resources is enabled. Select Riverwest, switch to Harambee, then clear selection; ensure stale rows disappear. Cover an area with no partners and retain the equivalent text-list path.

- [ ] **MAP-ASK · Start a private request for the selected partner** — Next, after MAP-RESOURCES. Handle /ask?partnerId=<directory-id> in the request screen and link the resource row to it. A valid partner stays preselected and editable; an unknown ID falls back to ordinary matching. Send from Riverwest with all optional fields off and check the assigned inbox, public feed and unchanged geographic totals.

- [ ] **MAP-NEEDS · Highlight areas still waiting for help** — Next, ready. Use aggregate open counts to shade neighborhoods by outstanding needs. Provide a legend, readable counts and an all-zero state. Accepting a request keeps its open count; completing the last outstanding service reduces it. Omitted neighborhoods stay out. Avoid making users interpret a historical incident layer as current demand.

- [ ] **MAP-PERIOD · Separate reporting periods on the activity map** — Next, ready. Add a date window for dated outreach/deliveries. Keep undated directory resources available and retain the published period on historical incidents. Verify a delivery just across a Milwaukee day boundary appears in exactly one weekly view.

- [ ] **MAP-SOURCE · Evaluate a newer Milwaukee incident source** — Later, ready. Use the linked [source notes](sources.md) to compare geography, period, counting unit, definitions and reuse terms against the bundled MHRC series. Deliver a reproducible aggregate import and a reconciliation for at least one published total, or document the precise data gap. Only switch the app when the source supports both the geography and labels shown.

- [ ] **MAP-OUTREACH · Show documented outreach alongside referrals** — Later, after SOC-EVENT. Add a selectable layer for public events and completed outreach, using the event’s public neighborhood. Verify a scheduled drive is distinguishable from completed outreach and neither becomes a household service. Open the event from both map and list.

## Outcomes and reports ComForce owns

Build on the shipped attribution view. Vaun emphasized knowing whether someone actually received help and which partner did the work. A portable report is valuable even if ComForce never adopts another system.

- [ ] **OUT-REPORT · Create a single program report projection** — Headline, ready. Use the [domain model](../src/domain/model.ts) to group recorded program services by actual provider and category. Include reporting period, sponsor, received funds and outstanding pledges. Feed the existing program summary and export from this projection. The seed has one qualifying delivery; another winter clothing delivery makes two, and a food delivery for another program leaves the winter count unchanged.

- [ ] **OUT-EXPORT · Hand a funder a usable report** — Headline, after OUT-REPORT. Add one secondary action on the program view. Web downloads a CSV with labeled sections and correct quoting; native shares a readable summary from the same model. Check names containing commas or quotes, a canceled share, zero deliveries and funding without a service. Inspect the output for resident text, contacts, referral IDs and worker notes.

- [ ] **OUT-RESPONSE · Measure time to the first response** — Next, ready. Compute median time from send to first provider response in the selected period and show the sample size and still-waiting count. One pending referral is excluded from the median. Verify a known set with two accepted times, an unanswered request and no eligible samples. Define how a decline counts if REF-DECLINE has landed.

- [ ] **OUT-HOUSEHOLDS · Count households reached without double counting** — Next, ready. Define a stable household key distinct from request ID. Only count households with a documented delivery; two referrals for one household count as one. For older records lacking a reliable key, expose unknown coverage separately. Publish only an aggregate and pin the behavior with a repeated-household fixture.

- [ ] **OUT-RECAP · Give a sponsor a campaign closeout** — Next, after FUND-CAFE + OUT-REPORT. Summarize eligible sales, pledge, amount remitted, allocation when available, and attributed program outcomes for one campaign period. Separate campaign-specific deliveries from wider program totals when attribution is unavailable. A reviewer should be able to trace every number to the ledger or a service record.

- [ ] **OUT-DATES · Report by period and provider** — Next, after OUT-REPORT. Apply the same date range and provider filters to the visible report and export. Use delivery time for service totals and receipt time for funds, and label each measure. A November delivery for an October request counts in November services. Show empty periods explicitly.

- [ ] **OUT-OWNERSHIP · Let an organization take its own work elsewhere** — Later, ready. Add a versioned, organization-scoped export for authorized provider records, separate from the public program summary. Test a round trip on a fixture and verify another provider’s private messages and unrelated residents are excluded. Document the fields and version so an organization can use the export independently.

## Integration, field testing and the pitch

These items are claimable by anyone, including someone who just finished a feature. Keep acceptance evidence with the task so the next teammate can reproduce it.

- [ ] **QA-IPHONE · Test the resident journey on a real iPhone** — Next, ready. Use the [mobile checklist](mobile.md), open the keyboard, enlarge system text, send with optional fields off, reload and complete the referral. Record phone model, OS, commit and the first failed step or pass. Reproduce and fix any blocked action.

- [ ] **QA-ANDROID · Test the worker journey on a real Android phone** — Next, ready. Complete an accepted referral in Expo Go, switch roles, reload, and check map and impact. Exercise back navigation and the keyboard. Also try native report sharing once available. Record device, OS, commit and result.

- [ ] **QA-INTEGRATE · Protect the full judging story across merges** — Headline, ready. On the integrated commit run npm run check and npm run export:web. Reset, send, accept and deliver in the local preview; compare resident timeline, map totals and provider credit. Repeat with the optional AI service stopped. Record the SHA and expected versus observed counts. Repeat after changes to referral cardinality or funding.

- [ ] **QA-STORAGE · Catch lost work on upgrade or interrupted saves** — Next, ready. Keep a snapshot from the published starter. Exercise decode, first new write, reload and repeated completion after introducing optional fields. Simulate a failed save followed by a successful retry; the previous committed state should remain usable. Cover the real snapshot shape rather than only constructing new records.

- [ ] **PITCH-STORY · Give judges one defensible before-and-after** — Headline, ready. Rehearse the [four-minute presentation](demo.md) on the projection laptop. Start with a resident’s own words, show the model’s reason, let the resident approve, show credited delivery and end with what a business funded. Use only merged features, identify the actual matching mode, and record the commit and live-section duration. Prepare a local backup recording.

- [ ] **PITCH-COST · Answer the nonprofit adoption question** — Next, after AI-MODEL. Write a short slide or speaker note with measured device/model requirements, recurring operating cost assumptions and who maintains the partner directory. Distinguish the cost of the local prototype from future hosting. Have a teammate explain the figures without assistance.

- [ ] **SUBMIT · Make the judged build reproducible** — Headline, after QA-INTEGRATE + PITCH-STORY. Follow the deadline in the [runbook](demo.md). Have someone other than the implementer open the GitHub link, install from the lockfile and run the documented commands. The designated teammate submits the link, verifies confirmation and adds the judged commit to the board.

- [ ] **PILOT-SYNC · Prove a real cross-device handoff** — Later, ready. Choose the smallest authenticated pilot with one resident and two provider accounts. Enforce assigned-partner access on the server. Verify one phone can send, another can accept, reload preserves the result, and the unrelated partner cannot read it. Preserve the local rehearsal path during integration.
