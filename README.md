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

## Set up a Codex worktree

Install Node.js using the version in `.nvmrc`. In the Codex desktop app, select the **ComForce Connect** local environment for a new Worktree chat. Its setup runs `npm ci` in the new checkout. Use **Mobile LAN**, **Mobile Tunnel**, or **Check** from the project actions. On a physical iPhone, sign into Expo Go and run `npx expo login` on the host with the same account before scanning. [Local environments](https://learn.chatgpt.com/docs/environments/local-environment)

[Current mobile interface](docs/references/community-current.png) · [Map sources and original mockups](docs/sources.md)
