# Achados atuais

## QA-001 — preview sem feedback durante carregamento

- **Severidade:** média.
- **Sintoma:** ao navegar com as setas, o Hero mudava de canal mas a camada de transição só aparecia depois de Enter/fullscreen.
- **Correção:** o preview agora tem estado explícito de loading/erro, timeout de 15 s e proteção contra atualização de canal obsoleta.
- **Validação:** foco rápido entre Band, RedeTV, Globo e TV Brasil; o estado final permaneceu no último canal e cada erro ficou isolado.

## QA-002 — login provider exige seleção explícita

- **Severidade:** baixa.
- **Sintoma:** a navegação precisava diferenciar “canal disponível” de “canal que exige login”.
- **Correção existente validada:** o Hero exibe coluna de acesso necessário; Enter abre a superfície do provider em tela cheia.
- **Validação:** RECORD Minas abriu `recordplus.com/login` com o redirect do canal correto.

## QA-003 — Escape na tela de login deixava estado de loading

- **Severidade:** média.
- **Sintoma:** sair da superfície nativa de login podia ser interpretado como retorno de player, mantendo o Hero em “Carregando canal” e ocultando o prompt de login.
- **Correção:** o Electron diferencia `mode: login` de `mode: player`; Escape no login emite `hidden/back`, oculta a superfície e restaura `auth-required` no overlay. Escape no player mantém `player/back`.
- **Validação:** testes de ciclo de vida e de provider reexecutados após reiniciar o Electron; o fluxo de login continua abrindo em fullscreen e não compartilha o alvo de outro canal.

## Observações sem correção nesta estação

- Autenticação social real depende de conta/serviço externo e não deve ser automatizada com credenciais do usuário.
- Android e Android TV nativos precisam de runner/build nativo; foram mantidos como pendentes, sem simular aprovação.
