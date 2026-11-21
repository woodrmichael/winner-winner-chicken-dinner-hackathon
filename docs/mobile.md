# Test on your phone with Expo Go

Expo Go opens the app on your phone while your laptop serves the code. Run both the resident and partner steps on the **same phone**. Each device and browser has its own saved workspace.

## First launch

1. On the laptop, install Node.js 26.3.0 with npm. Open PowerShell or Terminal in the cloned repo, where you can see `package.json`. Check `node -v`, then run `npm ci` to install the pinned dependencies. [Node.js 26.3.0 installers](https://nodejs.org/dist/v26.3.0/)
2. On the phone, install Expo Go for **SDK 58**. Connect the phone and laptop to the same Wi-Fi. [Expo Go installers](https://expo.dev/go)
3. **iPhone:** sign in to Expo Go. On your laptop, run `npx expo login` and sign in with that same Expo account. Each teammate can use their own account. [Expo sign-in instructions](https://docs.expo.dev/get-started/start-developing/)
4. Run `npm start` on the laptop. Leave that terminal open. When the QR code appears, scan it with **Camera** on iPhone and tap **Open in Expo Go**. On Android, open **Expo Go → Scan QR code**.
5. Wait for the first bundle to finish. You should see **Community**, the winter essentials drive, and four bottom tabs. Save an edit to your feature in the editor to see it refresh on the phone. Press **r** in the laptop terminal to reload, **w** to open the browser, and **Ctrl+C** to stop the server.

## Check a complete referral

| On the phone | Expected result |
| --- | --- |
| Start with a fresh workspace. For a repeat run, use **Activity → Reset workspace → Confirm reset** to discard the previous run. Open **Impact**. | 4 requests received, 2 open referrals, 2 services delivered. |
| Go to **Community → Ask for help → Clothing and a ride → Find resources**. | Winter Care Collective matches both clothing and transportation. |
| Select **Neighborhood · Harambee**, then **Send referral**. | Your referral appears in Activity as **Sent**. |
| Switch to **Partner view**, tap **Accept referral**, then press **r** on the laptop. Reopen Activity and Partner view if needed. | The winter partner still sees the accepted referral after reload. |
| Select **Clothing**, keep the winter program selected and tap **Record completed service**. Switch to **Resident view**. | The timeline shows **Completed**, with Winter Care Collective credited. |
| Open **Map**, then **Impact**. | Harambee shows 2 deliveries. Overall totals are 5 received, 2 open, 3 delivered. The winter program has 2 deliveries. |

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
| Open **Offers → Kids’ coats available → View offer and replies**. Ask about size 8, switch to **Offer author**, and reply. Reload and reopen the offer. | Both messages appear in order with their authors. |
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
| QR code opens, then times out | On iPhone, allow local network access for Expo Go. Campus Wi-Fi may isolate devices. Try a private network or stop the server and run `npm start -- --tunnel`, follow the CLI prompt if it requests the tunnel helper, and scan the new QR code. Tunnel mode needs internet. |
| iPhone reports an account mismatch | Run `npx expo whoami` and compare it with the account shown in Expo Go. Sign in to the same account on both, then retry. |
| Expo Go reports an incompatible SDK | Check the SDK 58 installer for your device. Run `npx expo install --check` from the repo to check package versions. |
| Phone shows an old bundle | Stop the server, run `npm start -- --clear`, and scan the new code. This clears the bundler cache. **Reset workspace** separately restores the starting records. |
| PowerShell blocks npm scripts | Run `npm.cmd` or `npx.cmd` in place of `npm` or `npx`. |
