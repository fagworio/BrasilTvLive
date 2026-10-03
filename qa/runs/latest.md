# Execução mais recente

- **Data:** 2026-10-03
- **Ambiente:** Linux, Electron em modo dev, Vite local, Chromium DevTools Protocol
- **Branch:** `main`
- **Commit validado:** `b1aa65e`

## Resultado por fase

| Fase | Resultado | Evidência |
|---|---|---|
| 0–1 Startup | PASS | `npm test`, `npm run build`; shell carregado sem `app-loading` |
| 2 Navegação | PASS | ArrowRight/Left/Up/Down alteraram foco e Hero |
| 3–4 Preview/loading | PASS | loading visível no canal focado; timeout e stale-channel guard |
| 5 Player | PASS | Enter abriu `watching`; Escape retornou ao catálogo |
| 6–7 Providers | PASS | Record Minas abriu login correto; overlay sem sessão validado |
| 8–9 Fullscreen/resize | PASS | player interno e superfície provider ocupam a janela |
| 10 Mobile | PENDENTE | sem runner Android nesta estação |
| 11 Região | PASS | região MG/Belo Horizonte persistida e usada no catálogo |
| 12–13 Recuperação/inesperado | PASS | falha TV Brasil virou indisponível; SBT continuou navegável; Escape do login foi corrigido |
| 14–21 Cenários críticos | PASS/PENDENTE | preview, timeout, isolamento e stress validados; Android/social pendentes |

## Comandos

```text
npm test       PASS (5/5)
npm run build  PASS (Vite; apenas warnings existentes de bundle)
git diff --check PASS
```

## Limitações

O login real do Record+/Globoplay e o login social não foram marcados como PASS porque exigem credenciais externas. A superfície de login, redirect, retorno de provider e isolamento foram testados sem inventar uma sessão.
