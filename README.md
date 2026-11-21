# ComForce Connect

Milwaukee residents can post offers and privately request help. A partner accepts a referral and records the service it delivered. That one entry updates the resident’s timeline, the neighborhood map and ComForce’s impact totals.

**First time using Expo?** Start with [testing on your phone](docs/mobile.md). The [team task board](docs/tasks.md) describes each workflow and the changes planned for it. Claim an open subtask by number and use its example to check your work.

## Run on a laptop

Install Node.js 26.3.0 (the version in `.nvmrc`). From the directory containing `package.json`, run:

```sh
npm ci
npm run web
```

| When you need to… | Run or read |
| --- | --- |
| Develop on a phone on the same network | `npm run mobile:lan` · [Expo Go setup and phone test](docs/mobile.md) |
| Develop on a phone using cellular or a different network | `npm run mobile:tunnel` · [Expo Go setup and phone test](docs/mobile.md) |
| Check a change before merging | `npm run check` runs lint, type checking and tests |
| Rehearse from a local build | `npm run export:web`, then `npm run preview` · [Local preview](http://localhost:4173) |
| Change referral behavior or metrics | [Architecture and contracts](docs/architecture.md) |
| Start an agent or hand work to another teammate | [Agent instructions](AGENTS.md) · [Task board](docs/tasks.md) |
| Prepare the four-minute presentation | [Presentation runbook](docs/demo.md) |

## Run the shared workspace

The default Expo setup opens the offline rehearsal. To try shared referrals, organization approval and volunteer coordination, open two terminals:

```powershell
# Terminal 1
npm.cmd run api

# Terminal 2
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8787'
npm.cmd run web
```

Open **Settings** to sign in. On first launch, the API prints unique passwords for the sample accounts. Use separate browser profiles or devices for `alex` (resident), `winter-worker` (approved worker), `candidate` (worker applying for membership) and `organizer` (Winter Care Collective administrator). `jordan` and `sam` are additional residents, and `table-worker` belongs to Neighborhood Table.

The server saves records in `.comforce/workspace.json`. Set `COMFORCE_API_DATA` to a new local file path to start a separate rehearsal and generate another set of passwords. Expo sessions are held in memory, so sign in again after a complete reload. Use sample records on a trusted local network. See the [shared phone walkthrough](docs/mobile.md#check-the-shared-workspace-on-two-devices) for LAN instructions.

## Set up a Codex worktree

Install Node.js using the version in `.nvmrc`. In the Codex desktop app, select the **ComForce Connect** local environment for a new Worktree chat. Its setup runs `npm ci` in the new checkout. Use **Mobile LAN**, **Mobile Tunnel**, or **Check** from the project actions. On a physical iPhone, sign into Expo Go and run `npx expo login` on the host with the same account before scanning. [Local environments](https://learn.chatgpt.com/docs/environments/local-environment)

[Current mobile interface](docs/references/community-current.png) · [Map sources and original mockups](docs/sources.md)
