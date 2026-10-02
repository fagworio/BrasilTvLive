# RecordPlus no desktop

O modo desktop usa Electron para carregar a superfície oficial do RecordPlus dentro da própria janela do BrasilTvLive.

```bash
npm install
npm run desktop:dev
```

No desktop, `Abrir login no app` carrega a página oficial em uma `WebContentsView` persistente. Depois da autenticação, o vídeo ocupa todo o hero como prévia atrás do texto e do gradiente do BrasilTvLive; ao assistir, a surface oficial sobe para frente e ocupa a janela inteira. A interface, navegação, seleção de canais e zapping continuam pertencendo ao BrasilTvLive.

A composição usa `BaseWindow` com duas `WebContentsView`s: o app fica acima do RecordPlus na prévia, enquanto os controles nativos de volume, fullscreen e navegação do provedor permanecem disponíveis quando o player está em primeiro plano. O app só controla o mute global da surface para manter a prévia silenciosa; não simula volume em uma página cross-origin.

A sessão usa a partição persistente `persist:recordplus`, portanto cookies, armazenamento e a sessão do provedor permanecem no Electron ao fechar e reabrir o aplicativo. A surface é ocultada durante a troca de canal e reutilizada, sem logout ou cópia de dados. O BrasilTvLive não lê nem copia credenciais, cookies ou tokens.

Ao iniciar o login a partir de um canal Record com URL direta, o app envia essa URL no `redirectTo` oficial do RecordPlus. Depois do login e da seleção do perfil, o provedor retorna ao mesmo canal Record escolhido; o BrasilTvLive não troca o destino para outro canal. Somente a navegação real para `/player/` confirma a conta como conectada. Se o provedor redirecionar para `/login`, o app mantém a surface oficial aberta e informa que a autenticação ainda é necessária, evitando o falso estado “logado”. Com a sessão conectada, a surface é restaurada automaticamente no canal ativo, sem exibir novamente o login; no guia ela permanece no hero em preview mudo e ocupa a área inteira ao abrir o player. `Esc`/Back retorna ao guia mantendo o preview mudo; `ArrowUp` e `ArrowDown` retornam o zapping para a lista do BrasilTvLive.

No navegador comum, o comportamento permanece o fallback por popup/aba, porque o RecordPlus bloqueia o carregamento em iframe. No desktop, o Electron desativa FedCM para que o botão social do Google use a janela OAuth oficial do provedor, compartilhando a partição persistente, sem alterar User-Agent ou copiar credenciais. Globo continua na etapa seguinte e não é habilitado por este slice.
