# Run and deploy ComForce Connect

## Shared workspace API

From the repo root, run `npm ci`, then start the API with `npm run api`. The first startup prints credentials for the workspace’s initial accounts. Open Settings to sign in. Keep the API terminal available and start the client from a separate terminal.

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8787'
npm.cmd run web
```

| Variable | Where to set it | Purpose |
| --- | --- | --- |
| `COMFORCE_API_HOST` | API host | Bind address. Defaults to `127.0.0.1`. Bind to the appropriate interface when serving phones or a proxy. |
| `COMFORCE_API_PORT` | API host | Listen port. Defaults to `8787`. |
| `COMFORCE_API_DATA` | API host | Workspace file. Defaults to `.comforce/workspace.json`. Use a persistent, backed-up path for a hosted instance. |
| `OPENAI_API_KEY` | API host | Server-side credential for live microphone transcription through OpenAI Realtime. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CHECKOUT_RETURN_ORIGIN` | API host | Hosted Checkout, signed payment events and the public return page. See [sponsorship setup](sponsorships.md#configure-the-api). |
| `EXPO_PUBLIC_API_URL` | Client build environment | Base URL for the shared workspace. Use an address reachable from the device. |

For a hosted shared workspace, run one API instance per workspace file and place it behind an HTTPS endpoint that forwards WebSocket upgrades. Serve the client builds with that endpoint as `EXPO_PUBLIC_API_URL`. Each phone or browser signs in with its own account. For local devices, follow the [shared phone walkthrough](mobile.md#check-the-shared-workspace-on-two-devices).

The web map reads live buses and service alerts from the public `GET /public/map/transit` endpoint. Set `EXPO_PUBLIC_API_URL` for a separate API origin or forward that route to the API on the web app’s origin. Expo Go and native builds can read the public MCTS feeds directly. Transit requires no workspace sign-in or provider key. [Data sources and refresh](sources.md)

## Mobile release

Configure the project in the publishing organization’s Expo account. Set the organization’s iOS bundle identifier and Android application ID in `app.json`, and set the hosted `EXPO_PUBLIC_API_URL` in the build environment. Use EAS Build to generate signed binaries and distribute them to TestFlight and Google Play internal testing. [Expo build setup](https://docs.expo.dev/build/setup/) · [Store submission](https://docs.expo.dev/deploy/submit-to-app-stores/)

```sh
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all
```

Before promoting a build, verify sign-in for both roles, send and accept a referral across two devices, record a delivery, check the event map and try a voice request on a physical phone. Expo Go provides the development install path in the [phone guide](mobile.md).

## Web release

Run `npm run check` and `npm run export:web` in the client build environment. Serve the resulting `dist/` directory with a fallback to `index.html` for application routes. Use `npm run preview` to verify the export locally, including a direct request or event link.
