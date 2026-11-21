# ComForce Connect task board

Tasks 1–5 keep their original subjects. Claim an open subtask by adding your name or branch beside its number. A checked box links to work on main. Where one task needs another, the entry says “After” and gives its number.

**Start with 2.1 if you’re choosing work now.** The family asking for clothes and a ride after a fire is the example to preserve. Then try “We already have coats but can’t get to the pickup.” Getting those two requests to the right partners for different reasons is the first AI milestone. Other independent starting points are **3.1** for the partner inbox, **5.2** for ComForce’s impact report and **6.1** for sponsorships.

## 1. Community and mobile UI

- [x] **1.1 Finish the community flow on a phone** · **Ben Nguyen.** Passed on iPhone 13 Pro Max, iOS 27.0.1. The walkthrough covered posting an offer, finding it under Offers after reload and completing a private request, with checks for the keyboard and larger text. Local commit `a697629` is awaiting the merge to land.
- [x] **1.2 Reply to an offer.** · **Ben Nguyen.** Someone reading “Winter coats available” can ask about a size. The post author can reply in the same thread, and both replies are there when the post is reopened. Private help requests stay in Activity.
- [x] **1.3 Join a community event.** · **Ben Nguyen.** Open the winter drive from the feed to see when and where it takes place and what to bring. Joining adds one volunteer to the count. Reopening shows the resident has joined, and cancelling removes that one place.
- [x] **1.4 Follow a neighborhood group.** · **Ben Nguyen.** Let a resident join a group, publish a community post to it and find it again under My groups. Leaving the group updates that feed. Use the existing Community tab so following a group takes no extra tab.

Stories 1.2–1.4 are implemented locally and passed browser testing in Chrome at 390 px. The same run verified offer persistence and private referral completion. The [phone walkthrough for the new stories](mobile.md#check-offer-replies-event-signups-and-groups) is pending.

## 2. Resource matching

Residents can already describe a need, see keyword matches, pick another directory partner and review what they’ll share. [Original referral flow](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/e8d981b)

- [ ] **2.1 Match the help someone still needs.** Use a language model to interpret the request, then rank existing directory partners by the needs they cover. The house-fire example should suggest Winter Care Collective for clothing and transportation. “We already have coats but can’t get to the pickup” should suggest transportation alone. Show a short reason grounded in the partner’s services. Keep the current matching and manual selection usable when the model is unavailable. Only the request text is needed for matching.
- [ ] **2.2 Help residents write the referral.** After 2.1. Offer an editable draft in the resident’s own voice. For the house-fire request, keep both needs and let the resident remove one, review the recipient and confirm the final message. They can also send their original wording.
- [ ] **2.3 Ask one useful follow-up.** After 2.1. For “I need help after the fire,” let the resident clarify what they need or choose a partner themselves. Answering “food for tonight” should bring up a food provider without restarting the request.

## 3. Referral coordination

Partners can already accept referrals and record a completed service. Residents can see both steps in Activity. [Original partner workflow](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/e8d981b)

- [ ] **3.1 Put the next referral at the top of the inbox.** A partner opening Activity sees requests awaiting a response first, accepted cases next and completed history last. Accepting or completing a referral moves it to the right group when the partner reopens the inbox.
- [ ] **3.2 Schedule a pickup or visit.** From an accepted referral, a partner can add a time and short instruction. The resident sees them in their timeline. Rescheduling updates the appointment and keeps the service open until delivery.
- [ ] **3.3 Hand a referral to another partner.** When the first partner can’t help, it can suggest a named alternative and give a reason. The resident reviews the new recipient and fields to share. Approval puts the request in the new inbox once. Declining keeps it out of that inbox.
- [ ] **3.4 Keep the second need open.** When a resident asks for clothes and transportation, recording clothing should credit the delivering partner once and leave the ride visible as outstanding. After the ride arrives, both services and their providers appear under the original request. Coordinate the counting change with anyone working on 4.3 or 5.2.
- [ ] **3.5 Turn a worker’s note into a service entry.** After 2.1 and 3.4. A worker types or uses phone dictation to enter “Dropped off the coats today. Ride still needed.” Offer clothing as the completed service and let the worker review the partner and program. Their confirmation records one delivery and leaves the ride open.

## 4. Milwaukee map

- [x] **4.1 Select a neighborhood and see its totals** · **Completed by paladugup for original task 4.** Selecting Harambee on the map or in the list connects the selection to its totals. The existing layer switches and list view are available. [Landed change](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/ba0083c)
- [ ] **4.2 Find a named resource on the map.** Selecting a neighborhood with resources should show which partners are there and what each offers. Choosing one starts the existing private request review with that partner selected. The resident can still change their choice.
- [ ] **4.3 Show where help is still needed.** Let a coordinator compare open needs and delivered services by category for the selected neighborhood. With one open ride and a completed clothing delivery, filtering to transportation should show the ride only. Use shared neighborhood totals and keep household locations private.
- [ ] **4.4 Show the distribution of fatal and nonfatal violence.** Build on the existing historical homicide and nonfatal shooting counts. Give each layer a distinct color and show how shading corresponds to count. A resident can switch between layers and read the neighborhood, reporting period and value. A missing observation must remain distinguishable from a recorded zero. [Milwaukee data sources](sources.md)

## 5. Impact and presentation

- [x] **5.1 Show who delivered help and which program it supported** · **Completed by paladugup for original task 5.** Impact credits the delivering partner, shows program delivery history and displays sponsor funding with pledges listed separately. [Landed change](https://github.com/woodrmichael/winner-winner-chicken-dinner-hackathon/commit/cfcf87e)
- [ ] **5.2 Give ComForce a monthly impact report.** Let Vaun pick a month and answer “How many requests came in, what help arrived, and who delivered it?” Count requests by received date and services by delivery date. A request received in October and served in November contributes to each month’s corresponding measure. Selecting one provider narrows the delivery breakdown.
- [ ] **5.3 Share the report with a funder.** After 5.2. From the selected report, share or copy a summary with the period, totals and provider credit. Someone reading it outside the app should see the same figures and understand whose work they represent. Exclude resident messages and contact details.
- [ ] **5.4 Show how long people wait for a response.** Give coordinators a median time from submission to first acceptance, alongside the count still awaiting a response. An unanswered referral adds to that count and stays out of the median. Reopening an accepted referral preserves its first response time.

## 6. Business partnerships and sponsorships

- [ ] **6.1 Track a sponsor’s pledge and payment.** Let ComForce record a business, program and pledge, then record money received against it. If a market pledges $200 and pays $50, the program shows $50 received and $150 outstanding from that pledge. Its delivered-service count stays the same.
- [ ] **6.2 Run a café fundraiser.** After 6.1. A café can back a program with $1 per featured drink. Recording 32 qualifying drinks creates a $32 pledge attributed to that café. Paying it moves the amount to received once, with the campaign still named on the program.
- [ ] **6.3 Give local businesses a way to sponsor a program.** A business can open the winter program, see its goal and recent work, and send ComForce a sponsorship inquiry for that program. The coordinator sees the business and its preferred contact method. An inquiry leaves funding totals unchanged.
- [ ] **6.4 Show sponsors what their program delivered.** After 6.1. On the program detail, show contributing businesses alongside the program’s recorded deliveries. A second sponsor paying into the same winter drive gets funding credit while each coat delivery still counts once and credits the service partner.

## 7. Partner directory

- [ ] **7.1 Help residents choose between partners.** A resident comparing two transportation providers can open either profile to see the services offered, area served and how pickup works. Selecting a partner carries that choice into request review. Use the same partner information in matching and map details.
- [ ] **7.2 Let partners update availability.** A partner can pause new referrals for a service and later reopen it. If rides pause but coats are available, their profile reflects both and new ride suggestions favor an available partner. Previously accepted rides remain visible in Activity. Coordinate the availability rule with whoever owns 2.1.
- [ ] **7.3 Bring a new service organization into the directory.** An organization submits its name, service area and help offered for ComForce to review. After approval it appears in the directory and becomes eligible for matching. A pending listing stays out of resident suggestions.

Once the features are together, use the [phone walkthrough](mobile.md) and [presentation runbook](demo.md) for the final rehearsal.
