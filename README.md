# Pavuna — Bot de Edital

Bot Discord em Node.js + discord.js v14.

## Comandos

- `/painel edital`
- `/exoneracao motivo:<texto> membro:<usuário>`
- `/promocao membro:<usuário> cargo_antigo:<cargo> novo_cargo:<cargo>`
- `/blacklist membro:<usuário>`

### Importante sobre os nomes

O Discord não aceita acentos nos nomes dos slash commands. Por isso:
- `/exoneração` vira `/exoneracao`
- `/promoção` vira `/promocao`

## Instalação

1. Instale Node.js 20 ou superior.
2. Abra o terminal nesta pasta.
3. Rode `npm install`.
4. Copie `.env.example` para `.env`.
5. Coloque o token do bot em `DISCORD_TOKEN`.
6. Coloque o ID do servidor em `GUILD_ID`.
7. Rode `npm start`.

## Permissões do bot

Para funcionar corretamente, o bot precisa, no mínimo:
- Ver canais
- Enviar mensagens
- Ler histórico
- Gerenciar canais
- Gerenciar cargos
- Banir membros

O cargo do bot precisa ficar acima dos cargos que ele vai atribuir/remover/gerenciar. O Discord aplica hierarquia de cargos às alterações feitas por bots.

## Observações

- O painel usa a imagem fornecida.
- O canal do edital fica privado para @everyone e libera os dois cargos de equipe indicados e o candidato.
- Fechar o edital exclui o canal após 5 segundos.
- Cada pergunta tem o limite configurado.
- As questões 6–10 são corrigidas pelo gabarito informado.
- Para aprovação, o código exige 5/5 nas questões objetivas.
- A exoneração remove todos os cargos que o bot consegue remover, preservando somente os dois cargos informados em `exoneracaoKeepRoles`.
- A blacklist funciona como alternância: se o usuário estiver banido, o comando tenta desbanir; caso contrário, bane.
- O bot não consegue remover/alterar cargos acima ou iguais ao cargo máximo dele.

## Personalização

Os IDs fornecidos estão no objeto `CONFIG` no início do `index.js`.
