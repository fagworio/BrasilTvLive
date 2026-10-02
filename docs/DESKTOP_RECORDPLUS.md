# RecordPlus no desktop

O modo desktop usa Electron para carregar a superfície oficial do RecordPlus dentro da própria janela do BrasilTvLive.

```bash
npm install
npm run desktop:dev
```

No desktop, `Abrir login no app` carrega a página oficial em uma `WebContentsView` posicionada sobre a área de vídeo do hero. No guia ela não cobre a barra lateral nem a grade EPG; no modo assistir, ocupa somente a área do player em tela cheia. A interface, navegação, seleção de canais e zapping continuam pertencendo ao BrasilTvLive.

A sessão usa a partição persistente `persist:recordplus`, portanto cookies, armazenamento e a sessão do provedor permanecem no Electron ao fechar e reabrir o aplicativo. A surface é ocultada durante a troca de canal e reutilizada, sem logout ou cópia de dados. O BrasilTvLive não lê nem copia credenciais, cookies ou tokens.

Depois do login e da seleção do perfil, o app redireciona automaticamente para o canal escolhido quando existe uma URL oficial `/player/`. Somente a navegação real para `/player/` confirma a conta como conectada. Se o provedor redirecionar para `/login`, o app mantém a surface oficial aberta e informa que a autenticação ainda é necessária, evitando o falso estado “logado”. Canais sem URL direta confirmada retornam à home oficial do RecordPlus sem loop e permanecem marcados como player direto não confirmado. `Esc`/Back oculta a surface e retorna ao guia; `ArrowUp` e `ArrowDown` retornam o zapping para a lista do BrasilTvLive.

No navegador comum, o comportamento permanece o fallback por popup/aba, porque o RecordPlus bloqueia o carregamento em iframe. O botão social do Google abre a janela OAuth oficial do provedor dentro do desktop, compartilhando a partição persistente, sem alterar User-Agent ou copiar credenciais. Globo continua na etapa seguinte e não é habilitado por este slice.
