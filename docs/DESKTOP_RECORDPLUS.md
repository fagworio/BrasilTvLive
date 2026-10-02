# RecordPlus no desktop

O modo desktop usa Electron para carregar a superfície oficial do RecordPlus dentro da própria janela do BrasilTvLive.

```bash
npm install
npm run desktop:dev
```

No desktop, `Abrir login no app` carrega a página oficial no painel direito. A sessão usa a partição persistente `persist:recordplus`, portanto cookies, armazenamento e a sessão do provedor permanecem no Electron ao fechar e reabrir o aplicativo. O BrasilTvLive não lê nem copia credenciais, cookies ou tokens.

Depois do login e da seleção do perfil, o app redireciona automaticamente para o canal escolhido quando existe uma URL oficial `/player/`. Quando essa rota real é carregada, a conta passa a aparecer como conectada. Canais sem URL direta confirmada retornam à home oficial do RecordPlus sem loop e são identificados no app como sessão conectada, mas player direto ainda não confirmado. `Esc`/Back fecha a surface; `ArrowUp` e `ArrowDown` retornam o zapping para a lista do BrasilTvLive.

No navegador comum, o comportamento permanece o fallback por popup/aba, porque o RecordPlus bloqueia o carregamento em iframe. O botão social do Google abre a janela OAuth oficial do provedor dentro do desktop, compartilhando a partição persistente, sem alterar User-Agent ou copiar credenciais. Globo continua na etapa seguinte e não é habilitado por este slice.
