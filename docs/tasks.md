# Team task board

Five people can take one row each. Give an agent its row and the [repo instructions](../AGENTS.md). Replace the open checkbox with a checked one and a PR or commit link when the work lands.

**Working today:** public offers, offline matching with manual partner selection, consent review, resident and partner timelines, persistent service recording, five map layers with native switches, and provider/program impact totals. The complete referral flow passed browser testing at phone width. Web, iOS and Android bundles build successfully.

## Next assignments

| Status | Owner and area | Next change | Acceptance check |
| --- | --- | --- | --- |
| [ ] | **1 · Community and mobile UI** · `src/features/community/`, `src/ui/`, root layout | Run the first-time phone walkthrough. Check posting and requesting help with the keyboard open and larger system text. Fix layout issues found. | Publish an offer, find it under Offers after reload, and complete a private request. Record device, OS and result below. |
| [ ] | **2 · Matching** · `src/features/matching/` | Build a small labeled set of paraphrases, mixed needs, negations and unmatched requests. Improve matching against that set. | “I already have a coat but need a ride” suggests transportation. The house-fire request still matches both needs, and a no-match request can still be sent manually. Add cases to the test suite. |
| [ ] | **3 · Coordination** · `src/features/activity/`, `src/domain/`, `src/state/` | Put actionable referrals ahead of completed history in the partner inbox. Own shared contract changes and integration checks. | A partner with both open and completed work can find the next referral immediately. Acceptance survives reload and repeated completion counts once. |
| [ ] | **4 · Map** · `src/features/map/` | Add neighborhood selection that connects a map label with its corresponding totals row. Retain the existing layer switches and list view. | Select Harambee, record a delivery with the neighborhood shared, and see the same count in the map and list. Check labels on a phone with all layers enabled. |
| [ ] | **5 · Impact and presentation** · `src/features/impact/`, presentation runbook | Make provider and program attribution easy to find after a delivery. Rehearse on the presentation laptop. | A teammate can identify the delivering partner and updated program count within ten seconds. Time the live section and record the result below. |

## Integration and rehearsal

- [ ] Physical iPhone walkthrough — record device, OS, result and any issue here.
- [ ] Physical Android walkthrough — record device, OS, result and any issue here.
- [ ] Coordination owner — run `npm run check` and `npm run export:web` on the combined changes.
- [ ] Presentation owner — test the local preview on the projector, time the pitch and submit the repository link. [Runbook](demo.md)

## After the weekend

1. Confirm with ComForce which referral outcomes it needs and who maintains partner directory entries.
2. Track multiple services per request so delivering clothing can leave transportation open. Update the lifecycle and metric definitions together.
3. Add authenticated resident and partner accounts with shared storage for cross-device handoffs.
4. Add an aggregate program report and evaluate a newer neighborhood incident series with comparable definitions.
