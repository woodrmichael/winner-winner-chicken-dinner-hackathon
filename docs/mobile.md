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

Also try typing your own request. Check that the keyboard leaves the message and submit action reachable. Record your phone model, OS and any failing step on the [task board](tasks.md).

## If it won’t open

| Symptom | Try |
| --- | --- |
| QR code opens, then times out | On iPhone, allow local network access for Expo Go. Campus Wi-Fi may isolate devices. Try a private network or stop the server and run `npm start -- --tunnel`, follow the CLI prompt if it requests the tunnel helper, and scan the new QR code. Tunnel mode needs internet. |
| iPhone reports an account mismatch | Run `npx expo whoami` and compare it with the account shown in Expo Go. Sign in to the same account on both, then retry. |
| Expo Go reports an incompatible SDK | Check the SDK 58 installer for your device. Run `npx expo install --check` from the repo to check package versions. |
| Phone shows an old bundle | Stop the server, run `npm start -- --clear`, and scan the new code. This clears the bundler cache. **Reset workspace** separately restores the starting records. |
| PowerShell blocks npm scripts | Run `npm.cmd` or `npx.cmd` in place of `npm` or `npx`. |
