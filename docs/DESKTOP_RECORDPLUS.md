# RecordPlus no desktop

O modo desktop usa Electron para carregar a superfície oficial do RecordPlus dentro da própria janela do BrasilTvLive.

```bash
npm install
npm run desktop:dev
```

No desktop, `Abrir login no app` carrega a página oficial no painel direito. A sessão usa a partição persistente `persist:recordplus`, portanto cookies, armazenamento e a sessão do provedor permanecem no Electron ao fechar e reabrir o aplicativo. O BrasilTvLive não lê nem copia credenciais, cookies ou tokens.

Depois do login, volte ao app com `Esc` e abra novamente o canal para carregar a URL oficial do live na mesma sessão. `Esc`/Back fecha a surface; `ArrowUp` e `ArrowDown` retornam o zapping para a lista do BrasilTvLive.

No navegador comum, o comportamento permanece o fallback por popup/aba, porque o RecordPlus bloqueia o carregamento em iframe. O botão social do Google abre a janela OAuth oficial do provedor dentro do desktop, compartilhando a partição persistente, sem alterar User-Agent ou copiar credenciais. Globo continua na etapa seguinte e não é habilitado por este slice.
