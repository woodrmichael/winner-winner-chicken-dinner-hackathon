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
| Develop on an iPhone or Android phone | `npm start` · [Expo Go setup and phone test](docs/mobile.md) |
| Check a change before merging | `npm run check` runs lint, type checking and tests |
| Rehearse from a local build | `npm run export:web`, then `npm run preview` · [Local preview](http://localhost:4173) |
| Change referral behavior or metrics | [Architecture and contracts](docs/architecture.md) |
| Start an agent or hand work to another teammate | [Agent instructions](AGENTS.md) · [Task board](docs/tasks.md) |
| Prepare the four-minute presentation | [Presentation runbook](docs/demo.md) |

[Current mobile interface](docs/references/community-current.png) · [Map sources and original mockups](docs/sources.md)
