# BrasilTvLive — roadmap de testes

Este diretório registra a execução sequencial do roadmap de QA do aplicativo. A ordem é intencional: cada fase valida uma camada antes de avançar para a seguinte.

## Ordem de execução

1. Preparação e startup (`001`)
2. Navegação TV e preview (`002`–`004`, `014`–`015`)
3. Player e ciclo de vida (`005`, `016`, `020`)
4. Providers e autenticação (`006`–`007`, `017`–`018`)
5. Fullscreen, resize, mobile e região (`008`–`011`, `021`)
6. Recuperação, uso inesperado e estresse (`012`–`013`, `019`)
7. Regressão completa e exploratório (`regression.md`)

## Comandos

```bash
npm install
npm test
npm run build
npm run desktop:dev
```

Para os cenários Electron, iniciar o app uma única vez, executar a sequência e fechar o processo ao terminar. Os providers externos são validados até a superfície de login/player; uma autenticação real depende de credenciais e da disponibilidade do serviço.

## Critério de aceite

- Nenhum erro não tratado no renderer ou no processo principal.
- O foco por teclado muda o canal e o Hero acompanha o canal focado.
- O preview mostra carregamento, erro ou conteúdo sem travar a navegação.
- Enter abre o player do canal correto; Escape retorna à navegação.
- Providers abrem a origem permitida, preservam o canal selecionado e isolam falhas.
- O layout existente permanece visualmente intacto fora dos estados de loading/erro.

Resultados e limitações da última execução: [`runs/latest.md`](runs/latest.md). Achados acumulados: [`findings/current.md`](findings/current.md).
