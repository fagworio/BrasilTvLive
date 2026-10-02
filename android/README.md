# RecordPlus Native Surface — Android / Android TV

Esta surface nativa é o ponto de integração do RecordPlus para Android e Android TV. Ela não tenta incorporar o site por `iframe` e não altera o User-Agent para contornar as regras do provedor.

## Comportamento

- O shell do BrasilTvLive abre `MainActivity` com `EXTRA_CHANNEL_URL` e `EXTRA_CHANNEL_NAME` do canal escolhido.
- A surface abre o login oficial com `redirectTo` para o mesmo canal. Depois da autenticação, o RecordPlus retorna ao player selecionado, sem redirecionar para outro canal.
- A surface ocupa a tela inteira em Android e Android TV; o vídeo oficial usa preenchimento `cover` e os controles de áudio, fullscreen, anúncios e navegação continuam sendo do RecordPlus.
- Cookies são mantidos exclusivamente pelo `CookieManager` nativo da WebView e recebem `flush()` em pausa, parada, encerramento e após o carregamento de páginas.
- O código não lê, exporta ou copia cookies, tokens ou credenciais para o BrasilTvLive, `localStorage` próprio ou backend.
- URLs de `accounts.google.com` são encaminhadas ao navegador externo. A POC registra que Google OAuth exige navegador/Custom Tab em vez de forçar o fluxo dentro da WebView.
- Back/Esc encerra o player e devolve o controle ao shell quando o canal já está reproduzindo; durante o login, Back ainda navega no histórico da WebView.
- `CH+`, `CH-`, `MEDIA_NEXT` e `MEDIA_PREVIOUS` encerram a surface com `EXTRA_CHANNEL_DIRECTION=next|previous` para o shell trocar de canal.
- Fullscreen do player é tratado por `WebChromeClient`; áudio, anúncios e controles permanecem sob responsabilidade do provider.

## Contrato de abertura

```java
Intent intent = new Intent(context, MainActivity.class)
        .putExtra(MainActivity.EXTRA_CHANNEL_URL, recordChannelUrl)
        .putExtra(MainActivity.EXTRA_CHANNEL_NAME, recordChannelName);
startActivityForResult(intent, RECORDPLUS_REQUEST_CODE);
```

Ao receber o resultado, o shell deve continuar exibindo sua lista e, quando `EXTRA_CHANNEL_DIRECTION` estiver presente, selecionar o canal seguinte/anterior. A sessão permanece na WebView nativa e não precisa de novo login enquanto o CookieManager do aplicativo estiver válido.

## Validação no dispositivo

1. Compile e instale a aplicação em um Android ou Android TV com WebView/Chrome atualizado.
2. Abra `MainActivity` com `EXTRA_CHANNEL_URL` apontando para RECORD Nacional, RECORD Minas ou RECORD News.
3. Teste primeiro uma conta RecordPlus com login próprio, se o provider oferecer esse fluxo.
4. Confirme a reprodução real do canal selecionado.
5. Feche e reabra a aplicação; confirme se a sessão RecordPlus foi restaurada.
6. Teste Back/Esc, CH+/CH-, áudio, fullscreen, anúncios e foco dos controles do provider.
7. Repita com `Entrar com Google`. Se o fluxo sair para o navegador ou retornar `disallowed_useragent`, registre o Google OAuth como restrição do provider para WebView.

## Limitação deste ambiente

O checkout atual não possui Android SDK, Gradle, `adb` ou emulador disponíveis. Por isso a compilação do APK e os testes de login/reprodução em dispositivo ainda precisam ser executados em uma máquina Android configurada. A implementação foi mantida sem dependências externas para facilitar essa execução.
