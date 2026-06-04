# 10 — Web Deployment

## Documents in this folder

| File | Description |
|------|-------------|
| [Athenea_WEB_GUIDE.md](Athenea_WEB_GUIDE.md) | Full web deployment guide |

## Web vs Android

ATHENEA is primarily designed for Android via Capacitor, but the web build is fully functional with limitations:

| Feature | Android | Web |
|---------|---------|-----|
| Native notifications | ✅ Full (tray) | ⚠️ Browser only |
| Home screen widgets | ✅ 9 widgets | ❌ Not available |
| Secure key storage | ✅ Capacitor Preferences | ⚠️ sessionStorage |
| Geolocation | ✅ Native GPS | ✅ Browser API |
| Voice input | ✅ Native plugin | ⚠️ Web Speech API |
| Offline | ✅ Full | ✅ Full (PWA) |

## Web Build

```bash
cd scope
npm run build    # outputs to dist/
```

## Web Deployment Options

### Vercel (recommended for web)
```bash
npm i vercel -g && vercel login
vercel --prod
```

### Static hosting (Netlify, GitHub Pages)
Build outputs to `dist/` — deploy as a static site.

### Self-hosted
Serve `dist/` with nginx or Apache. All routing is client-side (SPA) — configure `try_files $uri /index.html` in nginx.

## PWA Support

The web build supports PWA installation:
- Users can "Add to Home Screen" on mobile browsers
- Offline functionality via service worker
- App-like full-screen experience

## Important Notes

- Google Calendar OAuth requires `https://localhost` (dev) or your production domain added to Google Cloud Console authorized origins
- API keys entered via Settings are stored in `sessionStorage` on web (cleared on browser close) — recommend using Capacitor build for persistent key storage
