# ComForce Connect task board

A Milwaukee family needs clothes and a ride after a fire. In Community, a resident describes what the family needs, chooses a service partner and decides which details to share. In Activity, the partner accepts the referral and records a delivery. ComForce uses that record to see where help arrived and which organization provided it. To try both roles, follow the [referral walkthrough](mobile.md#check-a-complete-referral) on one device.

Each numbered item describes a change and an example the team can use to check it. Claim an open item by adding your name or branch beside its number. **After** lists prerequisites. When the change lands on main, check the box and link its PR or commit.

## 1. Community and mobile UI

Community is where neighbors offer items and organize activities. A resident with spare coats can post an offer for everyone to see. A family seeking help uses **Ask for help** to send a private referral to a partner. Both flows need to work on a phone while someone is typing.

- [x] **1.1 Complete the resident phone walkthrough.** Ben Nguyen verified publishing an offer, finding it under Offers after reload and sending a private referral on an iPhone 13 Pro Max running iOS 27.0.1, including keyboard and larger-text checks. [Mobile layout commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/a697629)
- [x] **1.2 Reply to an offer.** From “Kids’ coats available,” a neighbor asks whether the size 6 coat is still available. The author can answer on the post. Reopening the offer shows the question and answer together so the next reader can see what is available.
- [x] **1.3 Join a community event.** Open the winter drive from the feed to see when and where it takes place and what to bring. Joining reserves one volunteer place and updates the count. Reopening shows the resident has joined. Cancelling releases that place.
- [x] **1.4 Follow a public neighborhood group.** From Community, a resident joins a group, publishes an offer to it and finds the offer under My groups. Leaving removes the group from that feed. Its public posts remain visible to other neighbors.
- [x] **1.5 Save a post for later.** Save the winter drive, reload the app and find it under **Saved** in Community. Removing the bookmark removes it from Saved.
- [x] **1.6 Search community posts.** Search `coat` to find “Kids’ coats available” on the Community board. Search **My groups** for a post from a joined neighborhood. Private referrals stay in Activity.
- [x] **1.7 Use one compact header on phones.** Switch among the four tabs and compare heading size and gutters. Swipe left from the right edge to open Settings. Switch roles and tap Done to return to the same screen. Open Share report from Impact and repeat with larger system text. [PR #8](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/8)

- [x] **1.8 Simplify Community and event actions.** After 1.7. Find the winter drive from Community, filter to Events, search for a repair café, open it and join. Check its photo and the bookmark beside View event. Open a bookmarked event from Saved events in Activity and return there. Private requests and updates stay in Activity. Swipe left from the right edge to open Settings. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/50c6594c1de5ee45851659e0f2c4fc2f6b8e3ada)

- [x] **1.9 Keep position and media when changing screens.** After 1.7 and 1.8. Filter Community to Events, scroll to a photographed event and open it. Return to the same scroll position, then switch tabs and return. The feed image should remain mounted and the event photo should appear without a second fade. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/50c6594c1de5ee45851659e0f2c4fc2f6b8e3ada)

- [x] **1.10 Connect the feed, request review and Activity.** After 1.8, 2.2, 3.4, 8.1 and 10.1. Claimed by `codex/two-demo-views`. Join the winter drive from Community, open its event details, and open an offer without showing the report form. Review a request with an organization card and opt-in checkboxes, then verify its timeline and messages in Activity. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ecfda9b755ebe0c4aea2bb6ce60128cae6dd442e)

- [x] **1.11 Polish event cards, the map and private messages.** After the 1.10 changes. Claimed by `codex/two-demo-views`. On a phone, scroll past the repair café and driver orientation to find the winter drive. Open an event by tapping its card, join from the feed, and check the spacing between the count and the bookmark. Open the event and confirm its map appears automatically. Send a private message and check its alignment and confirmation. Open Map and check the event overlay is already on. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ecfda9b755ebe0c4aea2bb6ce60128cae6dd442e)

- [x] **1.12 Keep venue maps fast and make the partner inbox easier to scan.** After 1.11. Claimed by `codex/two-demo-views`. Open the winter drive, go back and reopen it with the map service unavailable. The same venue preview should appear each time. Switch to Partner and follow a new request through New, In progress and History. Check that the team and personal scopes still apply. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ecfda9b755ebe0c4aea2bb6ce60128cae6dd442e)

- [x] **1.13 Put the referral timeline and messages on one screen.** After 1.12. Claimed by `codex/two-demo-views`. Accept a request and record a delivery from the partner timeline. Scroll to Messages and send a reply, then open its notification as the resident to reach the inline thread. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ecfda9b755ebe0c4aea2bb6ce60128cae6dd442e)

- [x] **1.14 Show Joined on Community cards.** After 1.11. Claimed by `codex/two-demo-views`. Join an event, tap Joined and verify the count and RSVP update. Repeat with a winter drive role. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6914c534a0e5b3f0bb3df4d6db149d9f2265f109)

- [x] **1.15 Open volunteer roles from the event card.** After 1.14. Claimed by `codex/two-demo-views`. Choose a role from the winter drive card, reserve it on the event page and return to the same position in Community. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/77cedc3cec14a4396cb8a60e6ab68b1a4b77e0c2)

- [x] **1.16 Give Community one primary action.** Claimed by `codex/two-demo-views`. On a phone, verify the resident sees a full-width Ask for help action and the partner can still open the inbox. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/56158d8087db44632ed35c3c623ee006b8f2601c)

## 2. Resource matching

From **Community → Ask for help**, a resident can describe a situation without knowing which organization handles it. Today the app uses keywords to suggest directory partners. The resident can choose a different partner, review the message, and decide whether to include their first name, callback number, or neighborhood. The matching work below helps someone reach a partner that covers the help they still need.

- [x] **2.1 Match the needs expressed in the request.** Use a language model to interpret the request text and rank existing partners by the needs their services cover. For the family asking for clothes and a ride, suggest Winter Care Collective and explain that it offers both. For “We already have coats but can’t get to the pickup,” suggest transportation alone. Use only the request text for model input. Keep keyword matching and manual partner selection available when the model is unavailable. [Resource matching commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6e25bac)
- [x] **2.2 Help residents write the referral.** After 2.1. Offer an editable draft in the resident’s voice. The house-fire draft should include both clothing and transportation. A resident who has since found clothes can remove that need, review the recipient and send the revised message. They can also keep their original wording. [Resource matching commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6e25bac)
- [x] **2.3 Clarify a vague request.** After 2.1. For “I need help after the fire,” ask what help the resident needs. Answering “food for tonight” should bring up a food provider within the same request. A resident who already knows where to go can skip the question and choose a partner. [Resource matching commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6e25bac)
- [x] **2.4 Refresh the draft when needs change.** After 2.2. From a house-fire review with clothing and transportation in the draft, remove the Clothing need. The suggested message should drop clothing and keep the ride. The resident can still edit the text or restore their original wording before sending.
- [x] **2.5 Prefer partners that cover the resident’s neighborhood.** After 2.1. When the resident shares Harambee (or the request otherwise points there), rank a Harambee partner that covers the need ahead of an equal-coverage partner from another area. Directory order still breaks remaining ties. Manual selection of any partner stays available.
- [x] **2.6 Suggest more than one partner when no single org covers every need.** After 2.1. For a request that needs food and a ride, show that Neighborhood Table covers food and Riverwest Ride Circle covers transportation, with a short explanation for each, instead of only promoting whoever matches the most categories. The resident still picks one recipient to send.
- [x] **2.7 Preview the suggested draft before applying it.** After 2.2. On review, show a short preview of the suggested referral text without replacing the resident’s wording. The resident can read it, then tap Use suggested draft to apply it, or keep writing in their own words.
- [x] **2.8 Explain when no single partner covers every need.** After 2.6. For food and a ride, show a short tip such as that no organization covers both and the resident should pick who to contact first, alongside the complementary partner suggestions.
- [x] **2.9 Let residents add needs on review.** After 2.2. From a ride-only review, add Food (or another missing category). Needs update, partners re-rank, and a refreshed suggested draft becomes available without restarting Ask for help.
- [x] **2.10 Handle requests with no automatic matches.** After 2.1. For a request the directory cannot match automatically, show that no automatic matches were found and ask the resident to rephrase their request or select a partner manually. The full directory stays available for manual selection.

- [x] **2.11 Enter a request by voice.** After 2.1 and 2.2. Open Ask for help and tap the mic icon. On a supported browser or a configured shared workspace in Expo Go, watch the transcript update while speaking. Stop, edit the text, find resources, and use the back arrow to return to your wording. Without a transcription connection, Expo Go displays a brief status. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/50c6594c1de5ee45851659e0f2c4fc2f6b8e3ada)

- [x] **2.12 Simplify request review and the Food quick action.** After 2.11. Claimed by `codex/two-demo-views`. Use Food, apply the grocery draft and confirm Food is the only identified need. Send the request to Neighborhood Table. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6914c534a0e5b3f0bb3df4d6db149d9f2265f109)

- [x] **2.13 Confirm a sent request.** After 2.12. Claimed by `codex/two-demo-views`. Send a clothing request and verify the success screen shows the receiving organization, needs and message. Open the same request from the confirmation and check the partner inbox. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/56158d8087db44632ed35c3c623ee006b8f2601c)

## 3. Referral coordination

In Activity, the receiving partner sees the message and the details the resident agreed to share. Accepting tells the resident someone has taken the case. Each service credits the provider and leaves other needs outstanding. See the [shared counting rules](architecture.md#counting-rules-for-43-and-52) for Map and Impact.

- [x] **3.1 Put referrals awaiting a response first.** A worker opening the partner inbox should see which requests need a first response, followed by accepted cases and then completed history. Accept a request, reopen the inbox and find it among the accepted cases. Record a delivery and confirm it moves into completed history. [PR #1](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/1)
- [x] **3.2 Schedule a pickup or visit.** From an accepted referral, a worker adds a time and instructions such as “Saturday at 10, use the side entrance.” The resident sees both in Activity. If the worker reschedules, the resident sees the revised appointment and the case stays open until delivery. [PR #1](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/1)
- [x] **3.3 Hand a referral to another partner.** If a partner cannot provide a ride, the worker suggests another organization and explains why. The resident reviews the proposed recipient and the fields to share. Approval places the referral in the new partner’s inbox once. Declining keeps the request private from that partner. [PR #1](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/1)
- [x] **3.4 Keep outstanding needs visible after a delivery.** On the family’s request, record the coat delivery and credit the clothing provider once. The resident and coordinating worker should still see that the ride is outstanding. When the ride arrives, the original request shows both services and who delivered each. Coordinate the counting rules with the owners of 4.3 and 5.2. [PR #1](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/1)
3.5–3.6 completed by Corbin Langfeldt. [Worker workflow implementation](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/11cfc5e).

- [x] **3.5 Turn a worker’s note into a service entry.** After 2.1 and 3.4. A worker types or dictates “Dropped off the coats today. Ride still needed.” Suggest a clothing delivery and let the worker review the category, partner and program. Confirming the entry records one delivery and leaves transportation open.

- [x] **3.6 Assign a referral to a worker.** After 9.1. A partner assigns an accepted ride request to an approved worker. The team can see who is arranging the ride, and the worker can find it under their assigned requests. Reassign it to a colleague and verify that responsibility moves while request and service totals stay the same.
- [x] **3.7 Resolve a request a partner cannot fulfill.** A worker declines a ride and gives a reason. The resident sees that this provider declined and can seek another provider or withdraw the need. A ride still sought remains outstanding on the neighborhood map if the resident shared their neighborhood. Withdrawing it removes it from outstanding needs. Only a recorded ride counts as delivered. [PR #1](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/1)

- [x] **3.8 Move partner request tools below messages.** After 1.13. Claimed by `codex/two-demo-views`. Accept a clothing request, check that delivery and scheduling stay in the timeline, and find More actions at the bottom. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/56158d8087db44632ed35c3c623ee006b8f2601c)

## 4. Milwaukee map

Residents and coordinators can explore Milwaukee streets and select a reporting neighborhood to see assistance, providers and historical incident totals. Service activity uses the neighborhood a resident chose to share. Historical incident layers show their own reporting period.

- [x] **4.1 Select a neighborhood and see its totals.** Select Harambee on the map or in the list to see the same neighborhood totals. Layer switches and the list view remain available. Completed by paladugup. [Neighborhood selection commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ba0083c)
- [x] **4.2 Find a named resource on the map.** Completed by Corbin Langfeldt. Select a neighborhood with directory resources to see the partners there and what each offers. Choosing a provider opens the private request review with that partner selected. The resident can change their choice before sending. [PR #3](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/3)
- [x] **4.3 Show where help is still needed.** Completed by Corbin Langfeldt. For a selected neighborhood, let a coordinator compare outstanding needs and deliveries by category. In a neighborhood with an open ride and a completed coat delivery, filtering to transportation should show the open ride alone. Show aggregate neighborhood counts and keep household locations private. [PR #4](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/4)
- [x] **4.4 Make historical violence counts readable.** Completed by Corbin Langfeldt. Give homicide and nonfatal shooting layers distinct colors and a legend that explains the shading. A reader switching layers should be able to identify the neighborhood, reporting period and count, and distinguish a recorded zero from a missing observation. [Milwaukee data sources](sources.md) [PR #2](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/2)

- [x] **4.5 Interactive Milwaukee street map.** Drag and pinch to explore the city and tap a neighborhood. Switch to Community and back and check that the map keeps its position and selection and the Community cover image stays loaded. Repeat on web and Expo Go. [PR #8](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/8)
- [x] **4.6 Simplify map controls and neighborhood stats.** After 4.5. On a phone, confirm the logo stays visible in the tab bar. Select Harambee and tap it again to deselect it. Check that Service activity names the area and period. Filter to Transportation and verify the completed coat delivery is excluded. Toggle both incident overlays and check the dated legend above the map, then open request review from a named provider. [PR #8](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/8)
- [x] **4.7 Add cached public map data.** After 4.5. Select Public libraries, open a branch and check its address against Milwaukee Public Library. Reopen the map with the City feed unavailable and confirm the public locations still open. [PR #8](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/8)
- [x] **4.8 Map public community events.** After 1.3 and 4.5. Open the winter drive from Community to see Moody Park, its street address and a map directly on the page. Enable Community events and Public libraries together on Map, then tap the winter drive pin to open that same event. Show the related clothing and ride requests only in neighborhood totals. [PR #8](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/8)
- [x] **4.9 Broaden service activity coverage.** After 4.3. Open Map in an existing workspace and check 26 neighborhoods have service totals, including Havenwoods and Jackson Park. Compare the totals to the shared workspace reports and check that loading again adds each record once. [PR #8](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/8)

- [x] **4.10 Recover when Expo Go can’t load the embedded map page.** After 4.5. Claimed by `codex/two-demo-views`. Open Map with an Expo development QR and verify that the city map document and script load. If the web view fails to navigate, retry or browse neighborhoods. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6914c534a0e5b3f0bb3df4d6db149d9f2265f109)

## 5. Impact and presentation

Impact helps ComForce answer a funder’s question about what the winter program accomplished. A coat delivery credits the organization that supplied the coat and, when linked, the winter program. Funding appears alongside deliveries. The reporting work adds a time period so ComForce can describe a particular month and share the figures outside the app.

- [x] **5.1 Show who delivered help and which program it supported.** After recording a winter coat delivery, open Impact to find the delivering partner and the entry in the winter program’s history. The program also shows funds received and outstanding pledges separately. Completed by paladugup. [Program attribution commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/cfcf87e)
- [x] **5.2 Give ComForce a monthly impact report.** A coordinator selects a month to see how many requests came in, what services arrived and who delivered them. A request received in October and served in November counts as an October request and a November delivery. Selecting a provider narrows the delivery breakdown to that organization. [PR #5](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/5)
- [x] **5.3 Share the report with a funder.** After 5.2. From the selected report, share or copy a summary with the reporting period, totals and provider credit. Check that a reader outside the app can identify the month and provider and sees the same figures as the coordinator. Exclude resident messages and contact details. [PR #5](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/5)
- [x] **5.4 Show how long residents wait for a response.** Measure each answered referral from submission to first acceptance and show the median wait. Alongside it, show how many referrals still await acceptance. An unanswered request increases the waiting count and stays out of the median. Reopening an accepted referral preserves its first response time. [PR #5](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/pull/5)

## 6. Business partnerships and sponsorships

6.1–6.6 completed by Corbin Langfeldt. [Partnerships implementation](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/7070350).

One proposed funding model is for an employer to sponsor a ComForce project such as the winter drive. The employer could fund supplies, send employees to help, or pay ComForce to organize a volunteer day and report the results. An agreement would specify which funds cover direct services and which cover coordination or app operations. ComForce would decide which projects it can run and what to charge.

- [x] **6.1 Track a sponsor’s pledge and payment.** A coordinator records the business, the program it supports and the amount promised. Record a $200 pledge from a market, then apply a $50 payment to it. The program should show $50 received and $150 outstanding for that pledge, with the same delivery count.
- [x] **6.2 Confirm business support for a project.** After 6.1. On the winter drive page, show who runs it, its funding goal, supplies needed and volunteer places. An employer offers $200 and two volunteers. ComForce reviews the offer before listing the employer as a supporter. Record the confirmed pledge once through 6.1. The two volunteer places count toward staffing, and cash received changes when payment arrives.
- [x] **6.3 Explain the partnership and collect an inquiry.** A business considering the winter drive can see what sponsorship would pay for, where supporters receive credit and what updates to expect. If it asks about bringing a team, the coordinator receives the project, proposed support and preferred contact method. At this point the business is an inquiry, and volunteer places and funding totals stay unchanged.
- [x] **6.4 Show sponsors what their program delivered.** After 6.1. On the program detail, list contributing businesses alongside recorded services. If two businesses fund the same winter drive, each gets credit for its own contribution. Each coat delivery appears once and names the partner that supplied it.

- [x] **6.5 Allocate program and operating support.** After 6.1. For a $200 agreement covering $150 of supplies and $50 of coordination, record both purposes. When the employer pays in full, the report shows $150 received for supplies and $50 for operations, adding up to a single $200 payment.
- [x] **6.6 Give a business a partnership summary.** After 6.2 and 6.4. An employer supporting two projects can see its commitments, payments, upcoming activities and public updates together. A reader can identify what the business contributed and which partner delivered each service. Keep resident messages and contact details private.

- [x] **6.7 Collect sponsorship payments through Stripe Checkout.** After 6.1 and 6.5. Claimed by `codex/two-demo-views`. Confirm a pledge, share a link for a partial payment and verify the signed webhook credits the ledger once. Confirm that an expired link frees the reserved amount. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/6914c534a0e5b3f0bb3df4d6db149d9f2265f109)

- [x] **6.8 Improve the sponsorship project page.** After 6.7. Claimed by `codex/two-demo-views`. Open a project, find the main pledge action and team inquiry, and check that the funding totals and volunteer places reconcile with its supporter records. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/77cedc3cec14a4396cb8a60e6ab68b1a4b77e0c2)

## 7. Partner directory

Residents choose a referral recipient from the directory, and the matcher uses its service listings to suggest partners. A resident arranging a ride needs to know whether a provider serves their neighborhood, how pickup works, and whether the provider can take a new referral.

- [x] **7.1 Compare partners before sending a request.** Open two transportation providers’ profiles and check their services, coverage areas, and pickup arrangements. Selecting one carries that choice into request review. Use the same partner information for profiles, matching, and map details.
- [x] **7.2 Update availability by service.** A partner can pause ride referrals while continuing to accept clothing requests. The profile should show both statuses, new ride suggestions should favor available providers, and previously accepted rides should stay in Activity. Reopening rides makes that service available again. Coordinate the matching rule with the owner of 2.1.
- [x] **7.3 Add a service organization to the directory.** An organization submits its name, service area, and help offered. ComForce reviews the listing before residents can find it. Check suggestions while the listing is pending, then approve it and verify that it appears in the directory and is eligible for matching.
- [x] **7.4 Show when a service is temporarily paused.** After 7.2. When Winter Care pauses rides, a resident who looks that provider up in Ask, the directory, or the profile sees that transportation is temporarily paused (while clothing can still show as available). Ride-only suggestions still favor providers that are accepting rides.
- [x] **7.5 Decline a directory listing.** After 7.3. ComForce declines a pending organization, with optional feedback. The listing leaves the review queue and stays out of the resident directory and matching. Approving a different pending listing still works as in 7.3.
- [x] **7.6 Edit an existing directory partner.** After 7.1. An organization or a ComForce moderator updates a listing’s name, service area, help offered, coverage areas, or pickup arrangements (for example, permanently dropping transportation). Residents see the revised profile, matching, and map details without changing accepted referrals already in Activity.
- [x] **7.7 Remove a partner from the directory.** After 7.1. A ComForce moderator deletes an organization from the resident directory. Matching and map no longer suggest it. Accepted referrals and past deliveries keep their provider credit in Activity and Impact.

## 8. Private messages and notifications

A referral can be accepted before the worker knows enough to deliver help. A conversation attached to the request gives the family a place to answer, and an unread update helps each participant find the case that needs attention.

- [x] **8.1 Continue a private conversation about a request.** After 9.1. A worker asks which sizes to bring and the resident replies “6 and 8.” Reopen the request from each account and find both messages with senders and times. Another resident or an unrelated organization cannot read the thread.
- [x] **8.2 Open an unread update from Activity.** After 9.1. Sending a referral gives the receiving partner an unread item. Acceptance gives the resident one. Opening it takes that person to the referral and marks their item read, including after reopening Activity. Use the same behavior for a private reply or proposed handoff when those flows are available.

Ben Nguyen verified private messages and unread updates on iPhone and PC. [Shared workspace commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/526b591)

## 9. Resident and organization access

The device workspace switches roles on one phone. The [shared workspace](deployment.md#shared-workspace-api) uses signed-in accounts so residents and organizations can open their own referrals across devices.

- [x] **9.1 Open a referral from the right account.** Show the active person and organization. Send a request as a resident on one device, accept it as an approved worker on another, and verify that the resident sees the update. Check that an unrelated signed-in account cannot read the same referral or record a delivery against it.
- [x] **9.2 Approve a worker to act for an organization.** After 9.1. A worker requests membership or accepts an invitation. While approval is pending, the worker cannot open the partner inbox. After an authorized administrator approves membership, the worker can handle that organization’s referrals.

- [x] **9.3 Rehearse from two profiles on one phone.** After 9.1, 8.1, 8.2 and 10.2. Send a winter referral as Alex, then switch to Morgan to accept it, reply privately and record delivery. Return to Alex to see the same conversation and completed request. Check that resident actions and partner tools follow the active profile. [Implementation commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/50c6594c1de5ee45851659e0f2c4fc2f6b8e3ada)

Ben Nguyen verified cross-device referral access and worker approval on iPhone and PC. [Shared workspace commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/526b591)

## 10. Volunteer coordination

The winter drive needs people to sort coats and help with distribution. Before the event, the organizer needs to know which roles are filled. Afterward, attendance lets ComForce report who helped and how much time they contributed.

- [x] **10.1 Reserve a volunteer role.** After 1.3. The organizer lists four sorting places and two distribution places. Taking the last distribution place fills that role and puts its instructions in the volunteer’s Activity. Cancelling reopens one distribution place and leaves sorting capacity unchanged.
- [x] **10.2 Confirm attendance and time.** After 10.1. Two employees register and one works two hours. The organizer records attendance and the project summary shows two sign-ups, one participant and two contributed hours. The attending employee can use the confirmed hours when requesting an eligible employer volunteer grant.

Ben Nguyen verified volunteer reservations and attendance on iPhone and PC. [Shared workspace commit](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/526b591)

## 11. Post management and moderation

Neighbors need to know whether an offer is still available. Authors can keep listings current, and moderators need a way to review a reported post without exposing anyone’s private referral.

- [x] **11.1 Edit or close an offer.** The author updates “Kids’ coats available” after the size 6 coat is collected, then marks the offer fulfilled when the last coat is gone. Reopen the post and check its status and any existing replies. Closing a public offer leaves verified delivery totals unchanged. Author-only editing, fulfillment, persistence and delivery regression checks are implemented.
- [x] **11.2 Review a reported post.** A resident flags a post and a moderator reviews the report, records a reason and hides the post. Check the public feed from a second account. The post disappears and private referrals continue to appear for their participants. Report privacy, moderator authorization and hidden-post filtering are implemented.

## 12. Service records and corrections

A partner may need the individual entries behind its monthly totals or discover that a worker recorded a delivery by mistake. Both workflows depend on using the same service records as Activity, Map and Impact.

- [x] **12.1 Export an organization’s service records.** After 9.1. An authorized worker chooses a period and exports delivery dates, categories, provider credit and program links. For a month with two winter partner deliveries and one from another provider, the winter partner’s export contains its two entries and reconciles with its Impact count.
- [x] **12.2 Correct a mistaken delivery.** After 9.1. An authorized worker fixes the category or voids a delivery and records why. If a ride was marked delivered by mistake, voiding it restores the outstanding ride and updates Activity, the shared neighborhood’s counts and Impact. The correction history identifies the worker and reason.

For the team demo, use the [presentation runbook](demo.md) to rehearse the referral and show how the delivery changes the map and Impact totals.
