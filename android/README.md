# RecordPlus Native Surface POC

Esta POC cria uma surface Android nativa para o RecordPlus. Ela não tenta incorporar o site por `iframe` e não altera o User-Agent para contornar as regras do provedor.

## Comportamento

- `Login comum` abre o fluxo normal do RecordPlus dentro da WebView.
- `Minas Gerais` abre o player regional oficial já validado no navegador.
- Cookies são mantidos exclusivamente pelo `CookieManager` nativo da WebView e recebem `flush()` em pausa, parada, encerramento e após o carregamento de páginas.
- O código não lê, exporta ou copia cookies, tokens ou credenciais para o BrasilTvLive, `localStorage` próprio ou backend.
- URLs de `accounts.google.com` são encaminhadas ao navegador externo. A POC registra que Google OAuth exige navegador/Custom Tab em vez de forçar o fluxo dentro da WebView.
- Back volta na navegação da WebView e encerra a surface quando não há histórico.
- `CH+`, `CH-`, `MEDIA_NEXT` e `MEDIA_PREVIOUS` encerram a surface para devolver o controle ao shell do BrasilTvLive.
- Fullscreen do player é tratado por `WebChromeClient`; áudio, anúncios e controles permanecem sob responsabilidade do provider.

## Validação no dispositivo

1. Instale a aplicação em um Android com WebView/Chrome atualizado.
2. Abra `Login comum` e teste primeiro uma conta RecordPlus com login próprio, se o provider oferecer esse fluxo.
3. Abra `Minas Gerais` e confirme a reprodução real de RECORD Minas.
4. Feche e reabra a aplicação; confirme se a sessão RecordPlus foi restaurada.
5. Teste Back, CH+/CH-, áudio, fullscreen, anúncios e foco dos controles do provider.
6. Repita com `Entrar com Google`. Se o fluxo sair para o navegador ou retornar `disallowed_useragent`, registre o Google OAuth como restrição do provider para WebView.

## Limitação deste ambiente

O checkout atual não possui Android SDK, Gradle, `adb` ou emulador disponíveis. Por isso a compilação do APK e os testes de login/reprodução em dispositivo ainda precisam ser executados em uma máquina Android configurada. A implementação foi mantida sem dependências externas para facilitar essa execução.
