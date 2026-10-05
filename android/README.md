# RecordPlus Native Surface — Android / Android TV

Esta surface nativa é o ponto de integração do RecordPlus para Android e Android TV. Ela não tenta incorporar o site por `iframe` e não altera o User-Agent para contornar as regras do provedor.

## Comportamento

- O shell do BrasilTvLive mantém a navegação e abre uma tela de login acessível por controle remoto para RecordPlus e Conta Globo.
- O botão de login oficial abre uma Custom Tab ou navegador compatível. Login, provedores sociais e sessão ficam na superfície oficial do provedor; Android TV 9 não depende do WebView antigo para autenticar.
- A URL oficial recebe o canal selecionado como destino. O retorno do navegador não é tratado como login verificado; o usuário pode continuar no navegador e a sessão permanece sob controle do provedor.
- O Android System WebView sozinho não abre páginas externas. Se não houver navegador compatível, o app mostra uma mensagem e preserva a tela de login para permitir nova tentativa.
- O BrasilTvLive não lê, exporta ou copia cookies, tokens ou credenciais para o shell, `localStorage` próprio ou backend.
- A superfície oficial do player continua responsável pelo vídeo, áudio, fullscreen, anúncios e navegação.
- Back/Esc devolve o controle ao shell; fechar ou retornar do navegador não marca por si só a conta como conectada.
- `CH+`, `CH-`, `MEDIA_NEXT` e `MEDIA_PREVIOUS` encerram a surface com `EXTRA_CHANNEL_DIRECTION=next|previous` para o shell trocar de canal.
- Fullscreen do player é tratado por `WebChromeClient`; áudio, anúncios e controles permanecem sob responsabilidade do provider.

## Contrato de abertura

```java
Intent intent = new Intent(context, MainActivity.class)
        .putExtra(MainActivity.EXTRA_CHANNEL_URL, recordChannelUrl)
        .putExtra(MainActivity.EXTRA_CHANNEL_NAME, recordChannelName);
startActivityForResult(intent, RECORDPLUS_REQUEST_CODE);
```

Ao receber o resultado, o shell deve continuar exibindo sua lista e, quando `EXTRA_CHANNEL_DIRECTION` estiver presente, selecionar o canal seguinte/anterior. O login deste fluxo ocorre no navegador externo; o app não importa cookies nem presume que a sessão do navegador estará disponível na WebView. O provedor pode reaproveitar a sessão quando o usuário escolher “Continuar no navegador”.

## Validação no dispositivo

1. Compile e instale a aplicação em um Android ou Android TV com WebView/Chrome atualizado.
2. Abra `MainActivity` com `EXTRA_CHANNEL_URL` apontando para RECORD Nacional, RECORD Minas ou RECORD News.
3. Abra o login oficial, conclua a autenticação no navegador e confirme que o destino é o canal escolhido.
4. Retorne ao BrasilTvLive e use “Continuar no navegador”; confirme se o provedor reutiliza a sessão e abre o canal.
5. Repita com Globo e RecordPlus, usando os métodos de login disponíveis na página oficial de cada provedor.
6. Teste D-pad, Enter, Back/Esc, a mensagem de navegador ausente e a preservação do canal selecionado.
7. Confirme que retornar do navegador não marca por si só a conta como conectada.

## Estado da validação local

Este ambiente possui Android SDK, Gradle, `adb` e AVDs Phone/Android TV. A compilação e os testes de navegação podem ser executados localmente; autenticação completa e reprodução ainda dependem de uma conta válida, dos métodos oferecidos pelo provedor e de confirmação no dispositivo-alvo. Um retorno do navegador, isoladamente, não confirma a autenticação.
