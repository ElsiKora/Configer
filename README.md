# Configer

Configer is a TypeScript configuration loader inspired by `cosmiconfig`, with a clean API and strict clean architecture internals.

## Features

- Production-ready parsers for YAML, TOML, JSON5, JSONC, and `.env`.
- Async and sync clients.
- Config search strategies (`none`, `project`, `workspace`, `global`).
- Built-in support for JSON, YAML, TOML, JSON5, JSONC, JavaScript modules, `.env`, and `package.json` properties.
- Config inheritance via `extends`.
- Environment overrides via `$env` and `$<environmentName>`.
- Plugin lifecycle hooks.
- Lightweight built-in schema validation.

## Installation

```bash
npm install @elsikora/configer
```

## Quick Start (Async)

```ts
import { createConfiger } from '@elsikora/configer';

const configer = createConfiger<{ isFeatureEnabled: boolean }>({
  cwd: process.cwd(),
  moduleName: 'my-app',
});

const result = await configer.findConfig();

if (result) {
  console.log(result.filepath, result.config.isFeatureEnabled);
}
```

## Quick Start (Sync)

```ts
import { createConfigerSync } from '@elsikora/configer';

const configer = createConfigerSync<{ retries: number }>({
  cwd: process.cwd(),
  moduleName: 'my-app',
});

const result = configer.findConfig();

if (result) {
  console.log(result.config.retries);
}
```

## Migration from cosmiconfig

- Replace `cosmiconfig(moduleName, options)` with `createConfiger({ moduleName, ...options })`.
- Replace `search()` with `findConfig()`.
- Replace `load(filepath)` with `readConfig(filepath)`.
- Use `createConfigerSync` for synchronous API.
- Move custom transforms into plugins (`beforeRead`, `afterRead`, `onError`).

## Documentation

- `docs/getting-started/page.mdx`
- `docs/core-concepts/page.mdx`
- `docs/guides/page.mdx`
- `docs/api-reference/page.mdx`
