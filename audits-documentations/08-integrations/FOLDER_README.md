# 08 — Integrations

## Documents in this folder

| File | Description |
|------|-------------|
| [API_KEY_SETUP.md](API_KEY_SETUP.md) | LLM API key configuration |
| [OPENCLAW_INTEGRATION.md](OPENCLAW_INTEGRATION.md) | OpenClaw intelligence layer integration |
| [README_SERVER.md](README_SERVER.md) | Server setup (wirescope-backend) |

## LLM Integration

ATHENEA connects to LLM providers via `neuralAccess.ts`:

### Supported Providers
| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | gpt-4o, gpt-4o-mini | Standard, widely supported |
| Groq | llama-3.1-70b-versatile | Faster, cheaper |

### Configuration
```
Settings → AI section → Provider selector → API key input → Test connection
```

Key is stored securely:
1. Capacitor Preferences (native, encrypted) — primary
2. sessionStorage — web fallback
3. localStorage — last resort

### `neuralAccess.ts` API
```ts
getNeuralKey(): string | null       // sync (uses in-memory cache)
setNeuralKey(key: string): Promise  // stores to Capacitor Preferences
getNeuralProvider(): 'openai' | 'groq'
setNeuralProvider(provider): Promise
initNeuralKey(): Promise            // call at app boot to populate cache
```

## Google Calendar

OAuth 2.0 via web Client ID. See [05-modules/calendar/](../05-modules/calendar/FOLDER_README.md) for full setup.

```
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## OpenClaw Integration

The Intelligence Module is inspired by OpenClaw's architecture but adapted for single-user local-first use. The `openclaw-main` folder in the project root contains the reference implementation.

Key patterns borrowed:
- Skill-based action system
- Agent persona definition
- Event bus for cross-module communication

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | For Calendar | Google OAuth client ID |
| LLM API Key | For AI features | Set in-app via Settings, NOT in .env |

> API keys for LLM are intentionally NOT stored in `.env` — they're stored securely in device storage after being entered in Settings. This prevents key exposure in builds.
