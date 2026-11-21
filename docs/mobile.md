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
| Open **Impact** and note the starting totals. | A fresh workspace starts at 4 requests received, 2 open referrals and 2 services delivered. |
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

## If it won’t open

| Symptom | Try |
| --- | --- |
| QR code opens, then times out | For LAN mode on iPhone, allow local network access for Expo Go. Campus Wi-Fi may isolate devices. Stop the server, run `npm run mobile:tunnel`, and scan the new QR code. Tunnel mode needs internet. |
| iPhone reports an account mismatch | Run `npx expo whoami` and compare it with the account shown in Expo Go. Sign in to the same account on both, then retry. |
| Expo Go reports an incompatible SDK | Check the SDK 58 installer for your device. Run `npx expo install --check` from the repo to check package versions. |
| Phone shows an old bundle | Stop the server and restart with `npm run mobile:lan -- --clear` or `npm run mobile:tunnel -- --clear`. Scan the new code. |
| PowerShell blocks npm scripts | Run `npm.cmd` or `npx.cmd` in place of `npm` or `npx`. |
