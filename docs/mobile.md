# Test on your phone with Expo Go

Expo Go opens the app on your phone while your laptop serves the code. Run both the resident and partner steps on the **same phone**. Each device and browser has its own saved workspace.

## First launch

1. On the laptop, install Node.js 26.3.0 with npm. Open PowerShell or Terminal in the cloned repo, where you can see `package.json`. Check `node -v`, then run `npm ci` to install the pinned dependencies. [Node.js 26.3.0 installers](https://nodejs.org/dist/v26.3.0/)
2. On the phone, install Expo Go for **SDK 58**. [Expo Go installers](https://expo.dev/go)
3. **iPhone:** sign in to Expo Go. On your laptop, run `npx expo login` and sign in with that same Expo account. Each teammate can use their own account. [Expo sign-in instructions](https://docs.expo.dev/get-started/start-developing/)
4. Run `npm run mobile:lan` if the phone and host are on the same network. Run `npm run mobile:tunnel` for a phone on a different network or cellular. Leave the terminal open and scan the new QR code with **Camera** on iPhone or **Expo Go → Scan QR code** on Android. In a Codex worktree, the **Mobile LAN** and **Mobile Tunnel** actions run those same commands.
5. Wait for the first bundle to finish. You should see **Community**, the winter essentials drive, and four bottom tabs. Save an edit to your feature in the editor to see it refresh on the phone. Press **r** in the laptop terminal to reload, **w** to open the browser, and **Ctrl+C** to stop the server.

## Check a complete referral

Use the **Settings** gear at the top of the app to switch the **Referral view** between **Resident** and **Partner**. Select a **Partner inbox** when needed, then tap **Done**.

| On the phone | Expected result |
| --- | --- |
| Open **Impact**, tap the reporting month and choose **All time**. Note the starting totals. | A fresh workspace has 289 sample requests. Using All time makes it easy to compare totals after the walkthrough. |
| Go to **Community → Ask for help**. Type “We need clothes for the kids and a ride to pick them up.” Tap **Find resources**. | Winter Care Collective matches clothing and transportation. Tap its name to see the other sample partners. |
| Open **Sharing options**, select **Neighborhood · Harambee**, then tap **Send referral**. | Your referral appears in Activity as **Sent**. |
| In **Settings**, select **Partner**, then tap **Done**. Open the referral under **Awaiting response** and tap **Accept referral**. Press **r** on the laptop, then switch back to **Partner** in Settings. | The referral appears under **Accepted cases** after reload. |
| Open the referral if it is collapsed. Tap **Record delivery**, select **Clothing**, keep the winter program selected and tap **Record completed service**. Switch to **Resident view**. | Winter Care Collective is credited for clothing. Transportation remains outstanding. |
| Return to **Partner view**, open the referral and use **Record delivery** again to record transportation. | The referral moves to **Completed history**. The resident sees both deliveries. |
| Open **Map**, then **Impact**. | Harambee has 2 more deliveries. Impact has 1 more request, 2 more deliveries and the same number of open referrals as before the walkthrough. The winter program gained one delivery. |

## Check scheduling, handoffs and declines

Start a new clothing-and-ride referral and accept it as Winter Care Collective. Leave transportation open for the handoff.

| On the phone | Expected result |
| --- | --- |
| Open the accepted winter referral and tap **More actions → Schedule pickup or visit**. Enter a Saturday date, `10:00` and “Use the side entrance”. Save, switch to **Resident view**, then reschedule to `11:30` and change the instructions. | The resident sees the revised appointment in Milwaukee time. The referral stays open. |
| In **Partner view**, open the referral and tap **More actions → Suggest another partner** for transportation. Pick Riverwest Ride Circle and enter a reason. Use **Settings → Partner inbox** to switch to Riverwest before approval. | The proposed referral appears for the resident to review. Riverwest sees only its existing referrals. |
| On the resident’s proposal, share only the first name, then approve and reload. Open Riverwest’s inbox. | One new referral appears under **Awaiting response**, with the reviewed reason and first name. Accept and record transportation. The resident sees both providers on the original referral if Winter Care already recorded clothing. |
| Repeat with a fresh proposal and select **Decline handoff**. | Riverwest receives no new referral. |
| Send a ride request with the neighborhood shared. Open it as its partner and tap **More actions → Decline a need**, then enter a reason. Open **Map**, then go to **Resident view → Withdraw need → Confirm withdrawal** and check the map again. | The resident sees the reason. The ride counts as open until withdrawal. Deliveries stay the same. |
| Repeat the provider decline and choose **Seek another partner**. Review the message and sharing before sending. | The new partner sees the request once. The ride still counts as open until a provider delivers it or the resident withdraws it after another decline. |

Also try typing your own request. Check that the keyboard leaves the message and submit action reachable. Include your phone model, OS and the result in the PR for the change you tested.

## Community and larger-text walkthrough

Run this on the same phone as the referral check above. Record the model, OS,
text-size setting and results on the task board. Browser checks do not replace
the native keyboard and system-text checks.

1. Open **Community → Post an offer**. Enter a long title and a description
   spanning several lines. With the keyboard open, scroll to **Publish offer**
   and tap it. The offer should appear on the board after one tap.
2. Reload the app, select **Offers**, and confirm the title and description
   remain. Check that the author, title and filter labels stay inside their cards.
3. Open **Ask for help** and type a request with the keyboard open. Scroll to
   **Find resources** and tap it. On the review screen, edit the message and
   scroll through partner selection, optional sharing and **Send referral**.
4. Select the winter partner and send the referral. Confirm it appears in
   **Activity**, and that its private message is absent from all Community filters.
   Finish acceptance and service recording using the complete-referral check above.
5. Increase system text size (iOS: **Settings → Accessibility → Display & Text
   Size → Larger Text**; Android: search Settings for **Font size**). Repeat the
   offer and request steps. Check the brand header, four bottom tabs, filters,
   multiline fields and long action labels for clipping or unreachable controls.
   Restore your preferred setting afterward.

## Check offer replies, event signups and groups

| On the phone | Expected result |
| --- | --- |
| Open **Offers → Kids’ coats available → View offer and replies**. Ask about size 8. Tap the gear, select **Offer author** under **Reply to offers as**, tap **Done**, and reply. Reload and reopen the offer. | Both messages appear in order with their authors. |
| Open **Winter essentials drive → View event**. Read when and where it takes place and what to bring. Tap **Join event**, reload and reopen the event, then tap **Cancel signup**. | The count increases by one, the signup survives reload, and cancellation restores the original count. |
| Open **Community → My groups → Join Harambee → Post to Harambee**. Publish a post, reload and reopen **My groups**. Tap **Leave Harambee**, then rejoin. | The post appears under My groups and stays out of the public board. Leaving hides it and rejoining brings it back. |

## Check saved posts and search

| On the phone | Expected result |
| --- | --- |
| Tap the bookmark at the bottom right of the winter drive post, reload and open **Saved**. Tap the filled bookmark. | The bookmark fills when saved. The event survives reload in Saved and disappears from that view when removed. |
| In **Community board**, type `coat` in **Search posts**. Open **Offers** and tap **Clear search**. | Search finds “Kids’ coats available,” and clearing it restores all offers. |
| In **My groups**, join Harambee and publish a post with a distinctive title. Search for it in My groups, then switch to Community board. | The post appears in the group search and stays out of the board results. |

## Check the shared workspace on two devices

On the laptop, set `$env:COMFORCE_API_HOST = '0.0.0.0'` and run `npm.cmd run api`.
In the terminal that starts Expo, set `EXPO_PUBLIC_API_URL` to the laptop’s LAN
address and port, for example `$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.20:8787'`.
Start `npm.cmd run mobile:lan` and open the project on the phone. Launch the web
app with the same API URL to test using a second account on the laptop.

| What to check | Expected result |
| --- | --- |
| Sign in as `alex` on the phone. Send a clothing request to Winter Care Collective. On the laptop, sign in as `winter-worker` and accept it. | The worker’s Activity shows the organization and request. Alex sees the accepted status within a few seconds. |
| Open Activity as `table-worker` or another resident. As `candidate`, request Winter Care Collective membership, then approve that request from `organizer` in Settings. | Unrelated accounts cannot open the request. The candidate sees an approval notice while waiting and can open the correct inbox after approval. |
| From the winter drive, reserve the two distribution places as `alex` and `jordan`. Open the event as `sam`. Cancel one reservation, then reserve the reopened place. | Sorting stays at four places. Distribution shows Full at two. The volunteer’s role and instructions appear in Activity. |
| As `organizer`, record 120 minutes for the attending volunteer and zero for the other. Open the event summary and the attendee’s Activity. | The summary shows two sign-ups, one participant and two contributed hours. The attendee can select and copy the hours confirmation. |

## Check private messages and unread updates

Use the shared workspace with a resident and approved worker on separate devices.

| What to check | Expected result |
| --- | --- |
| As `alex`, send a clothing referral to Winter Care Collective. As `winter-worker`, open the new unread item in **Activity** and accept it. Go back to Activity. | The update opens the exact referral and stays read when Activity is reopened. Alex gets an unread acceptance update. |
| In the referral’s private conversation, ask which sizes to bring. From Alex’s unread reply, open the conversation and answer “6 and 8.” Reopen it from both accounts. | Both messages show a sender and time. The reply opens the conversation and clears its unread status for the signed-in account. |
| Use `jordan` or `table-worker` to open Activity. If testing a handoff, approve a different provider and open its new assignment. | Unrelated accounts do not see the messages. The new provider opens a separate thread and cannot see the original conversation. |

## Check monthly impact

In a shared workspace, sign in before opening Impact. Its totals come from the server.

1. In a fresh workspace, open **Impact**. November 2026 shows 126 requests, 89 deliveries, 62 residents assisted and 58 open referrals. The median time to first acceptance is 1 hour 35 minutes, with 25 referrals still awaiting acceptance.
2. Select **Winter Care Collective** in **Assistance by type**. Compare the delivery total and breakdown. Open **Winter essentials** under **Recent work** and tap **View delivery history** to see who delivered the clothing. Program funding shows $1,250 received and $300 pledged.
3. Tap the share icon at the top of Impact and compare the month, provider and totals in the summary. Tap **Share summary** and confirm the phone’s share sheet opens. On the web, use **Copy summary** and paste it into a local editor.
4. Tap the month beside **Our impact** and choose **October 2026**. Check that the month and provider menus float over the page and dismiss when you tap outside. Compare October’s 74 requests and 67 deliveries with November, then repeat on a narrow phone with larger system text.

## Check business partnerships

Open **Community → Winter essentials drive → Team inquiries and project details**. Ask about bringing a team, then offer $150 for supplies, $50 for operations and two volunteers. In shared mode, sign in as the organizer to review the inquiry and confirm the offer. For local rehearsal use **Settings → Partner → Winter Care Collective**. From **Manage project support → Payments**, expand the business pledge and apply a $50 payment and verify $150 remains. Pay the balance and check the allocation on the program page. Use the same business name for a pantry meal-kit pledge and find both projects in **Business summary**. Only confirmed business places count toward staffing. Confirming or paying a pledge leaves delivery counts unchanged.

## If it won’t open

| Symptom | Try |
| --- | --- |
| QR code opens, then times out | For LAN mode on iPhone, allow local network access for Expo Go. Campus Wi-Fi may isolate devices. Stop the server, run `npm run mobile:tunnel`, and scan the new QR code. Tunnel mode needs internet. |
| iPhone reports an account mismatch | Run `npx expo whoami` and compare it with the account shown in Expo Go. Sign in to the same account on both, then retry. |
| Expo Go reports an incompatible SDK | Check the SDK 58 installer for your device. Run `npx expo install --check` from the repo to check package versions. |
| Phone shows an old bundle | Stop the server and restart with `npm run mobile:lan -- --clear` or `npm run mobile:tunnel -- --clear`. Scan the new code. |
| PowerShell blocks npm scripts | Run `npm.cmd` or `npx.cmd` in place of `npm` or `npx`. |
