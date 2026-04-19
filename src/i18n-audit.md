# Diagnostico completo del sistema de idiomas en ATHENEA

Fecha: 2026-04-17
Ruta de ejecucion: C:\Workspace\Athenea
Modo: Solo analisis (sin cambios de codigo funcional)

## ANALISIS 1 — Existe sistema de i18n?

Comando ejecutado:

```powershell
Get-ChildItem -Recurse scope/src -Include "*.json","*.ts","*.js","*.jsx" |
Where-Object { $_.Name -match "i18n|locale|lang|translation|strings" }
```

Resultado:

```text
Directory: C:\Workspace\Athenea\scope\src\context

Mode   LastWriteTime         Length Name
----   -------------         ------ ----
-a---- 4/9/2026 11:41 AM     81609  LanguageContext.jsx
```

Lectura rapida:
- Se detecta infraestructura de idioma en `LanguageContext.jsx`.
- No aparecen muchos archivos nombrados como `i18n`, `translations` o `locale` por convencion de nombre.

## ANALISIS 2 — Donde se guarda el idioma?

Comando solicitado por el usuario (ruta original):

```powershell
Get-Content scope/store/slices/userSettingsSlice.ts |
Select-String -Pattern "language|lang|locale"
```

Resultado con ruta original:

```text
ERROR: path no existe (scope/store/slices/userSettingsSlice.ts)
```

Ruta real encontrada en el repo:

```text
scope/src/store/slices/userSettingsSlice.ts
```

Comando reintentado sobre ruta real:

```powershell
Get-Content scope/src/store/slices/userSettingsSlice.ts |
Select-String -Pattern "language|lang|locale"
```

Resultado:

```text
export type VoiceLanguage = 'en-US' | 'es-MX' | 'es-ES' | 'auto';
voiceLanguage: VoiceLanguage;
voiceLanguage: 'auto',
setVoiceLanguage: (state, action: PayloadAction<VoiceLanguage>) => {
  state.voiceLanguage = action.payload;
}
```

Lectura rapida:
- El idioma/locale de voz se persiste como `voiceLanguage` en `userSettingsSlice`.
- Se usan locales concretos (`en-US`, `es-MX`, `es-ES`) y modo `auto`.

## ANALISIS 3 — Textos hardcodeados en ingles en Navbar

Comando solicitado por el usuario (ruta original):

```powershell
Get-Content scope/src/components/Navigation/TopNavbar.tsx |
Select-String -Pattern "Work|Personal|Finance|Calendar|Settings|Identity|Alerts|Stats"
```

Resultado con ruta original:

```text
ERROR: path no existe (scope/src/components/Navigation/TopNavbar.tsx)
```

Ruta real encontrada en el repo:

```text
scope/src/components/AppShell/TopNavbar.tsx
```

Comando reintentado sobre ruta real:

```powershell
Get-Content scope/src/components/AppShell/TopNavbar.tsx |
Select-String -Pattern "Work|Personal|Finance|Calendar|Settings|Identity|Alerts|Stats"
```

Resultado relevante:

```text
label: t('Work')
label: t('Personal')
label: t('Finance')
{t('Calendar')}
title={t('Settings')}
title={t('Identity')}
<span className="nav-icon-label">Stats</span>
```

Lectura rapida:
- Mayormente envuelto con `t(...)` (traducible).
- Se detecta al menos un texto potencialmente hardcodeado: `Stats` (sin `t(...)`) en etiqueta visual.

## ANALISIS 4 — Textos hardcodeados en ingles en WorkHub

Comando ejecutado:

```powershell
Get-Content scope/src/pages/WorkHub.jsx |
Select-String -Pattern '"Work|"Task|"Project|"Focus|"Create|"New|"Add|"Done|"Block'
```

Resultado (extracto):

```text
... className="workhub-container" ...
... className="workhub-header" ...
... className="workhub-card" ...
... {t('See all')} ...
... {t(project.status || 'Active')} ...
... {t('No open tasks')} ...
```

Lectura rapida:
- El patron solicitado tambien captura `className`/nombres CSS (ruido).
- Se observan cadenas de UI en ingles dentro de `t(...)` (`Active`, `No open tasks`), por lo que dependen de traducciones disponibles.

## ANALISIS 5 — Textos hardcodeados en ingles en MyTasks

Comando ejecutado:

```powershell
Get-Content scope/src/pages/MyTasks.jsx |
Select-String -Pattern '"List|"Kanban|"Table|"Gantt|"Filter|"Search|"Archive|"Delete'
```

Resultado (extracto):

```text
... className="gantt-wrapper" ...
... className="gantt-header" ...
... className="gantt-week-label" ...
... className="gantt-task-title" ...
```

Lectura rapida:
- El resultado sale dominado por `className` (`gantt-*`), no por labels de UI necesariamente visibles al usuario.
- Con este patron no se confirma hardcode directo de labels (`List`, `Kanban`, etc.) en texto renderizado.

## ANALISIS 6 — Textos hardcodeados en ingles en Finance

Comando ejecutado:

```powershell
Get-Content scope/src/pages/FinanceHub.jsx |
Select-String -Pattern '"Income|"Expense|"Wallet|"Budget|"Debt|"Save|"Add|"New'
```

Resultado (extracto):

```text
... className="wallet-kpi" ...
... className="wallet-kpi-link" ...
navigate('/finance/wallets')
navigate('/finance/debts')
```

Lectura rapida:
- Igual que en 4/5, el patron atrapa nombres de clase/rutas.
- No prueba por si solo que haya labels hardcodeados al usuario final.

## ANALISIS 7 — Textos hardcodeados en ingles en Identity

Comando ejecutado:

```powershell
Get-Content scope/src/pages/IdentityHub.jsx |
Select-String -Pattern '"Save|"Agent|"Name|"Language|"Cancel|"Edit'
```

Resultado (extracto):

```text
... className="agent-card-top" ...
... className="agent-icon" ...
... className="agent-status-text">Activo</span>
... className="agent-role-text" ...
```

Lectura rapida:
- Resultado predominantemente por `className` `agent-*`.
- Se observa texto visible en espanol (`Activo`) dentro del archivo.

## ANALISIS 8 — Contar archivos con textos en ingles

Comando ejecutado:

```powershell
Get-ChildItem -Recurse scope/src/pages -Include "*.jsx","*.tsx" |
ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $count = ([regex]::Matches($content, '"[A-Z][a-z]')).Count
  if ($count -gt 5) {
    "$($_.Name): $count textos en inglés aproximados"
  }
}
```

Resultado:

```text
Dashboard.jsx: 7 textos en inglés aproximados
FinanceWallets.jsx: 6 textos en inglés aproximados
Settings.tsx: 55 textos en inglés aproximados
```

Lectura rapida:
- El conteo es aproximado por regex y no distingue:
  - texto de UI real,
  - claves de traduccion,
  - nombres de propiedades/componentes.
- Aun asi, marca `Settings.tsx` como principal hotspot para auditoria manual de hardcodes.

## Resumen ejecutivo

1. Si existe base de sistema de idioma (`LanguageContext` + `userSettingsSlice` para `voiceLanguage`).
2. Dos rutas en comandos originales estaban desactualizadas respecto a estructura actual del repo:
   - `scope/store/slices/userSettingsSlice.ts` -> real: `scope/src/store/slices/userSettingsSlice.ts`
   - `scope/src/components/Navigation/TopNavbar.tsx` -> real: `scope/src/components/AppShell/TopNavbar.tsx`
3. En `TopNavbar` predomina uso de `t(...)`; se detecta posible hardcode puntual (`Stats`).
4. Los patrones de 4-7 generan bastante ruido por coincidencia con `className`/rutas.
5. Conteo aproximado (A8) sugiere foco de revision en `Settings.tsx`.
