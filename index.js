const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

require('dotenv').config();

const CONFIG = {
  imageUrl: 'https://media.discordapp.net/attachments/1550653825659183144/1550714361973051474/Captura_de_tela_2026-09-19_004348.png?ex=6aaf56ca&is=6aae054a&hm=fd4f3deb9bbe0a581417d2504740aecfd43e72995527cc5bfb8804ec21f06eec&=&format=webp&quality=lossless',

  panelRoles: [
    '1550615266046644259',
    '1550615266046644258'
  ],

  editalAccessRoles: [
    '1550615266030002192',
    '1550615266030002193'
  ],

  approvedRoles: [
    '1550615266004574308',
    '1550615265954373758',
    '1550678827603329044'
  ],

  exoneracaoAllowed: [
    '1550615266046644258',
    '1550615266046644257',
    '1550615266030002189'
  ],

  promocaoAllowed: [
    '1550615266046644258',
    '1550615266046644257',
    '1550615266030002191'
  ],

  blacklistAllowed: [
    '1550615266046644258',
    '1550615266046644257',
    '1550615266030002189'
  ],

  exoneracaoKeepRoles: [
    '1550615265954373757',
    '1550615265954373756'
  ],

  editalCategoryId: process.env.EDITAL_CATEGORY_ID || null,

  logChannelId: process.env.LOG_CHANNEL_ID || null,

  closeAfterMs: 5000
};


// ======================================================
// PERGUNTAS
// ======================================================

const QUESTIONS = [
  {
    n: 1,
    text: 'Qual é o seu Nome [Completo!]?',
    minutes: 3
  },

  {
    n: 2,
    text: 'Qual seu nick?',
    minutes: 3
  },

  {
    n: 3,
    text: 'Qual é seu ID?',
    minutes: 3
  },

  {
    n: 4,
    text: 'Por que quer entrar para nossa Facção? Mínimo 2 linhas!',
    minutes: 5
  },

  {
    n: 5,
    text: 'Já participou de alguma fac/corp? Se sim, qual e quanto tempo ficou nela?',
    minutes: 5
  },

  {
    n: 6,
    text: 'O que é RDM?',
    minutes: 5,
    options: [
      'A) Matar alguém sem motivo',
      'B) Atropelar alguém sem motivo',
      'C) Usar informação de fora do jogo para o jogo',
      'D) Fazer coisas impossíveis de fazer humanamente'
    ],
    answer: 'A'
  },

  {
    n: 7,
    text: 'O que é VDM?',
    minutes: 5,
    options: [
      'A) Matar alguém sem motivo',
      'B) Usar informações de fora do jogo para o jogo',
      'C) Atropelar alguém até a morte',
      'D) Fazer coisas impossíveis de fazer humanamente'
    ],
    answer: 'C'
  },

  {
    n: 8,
    text: 'O que é CL?',
    minutes: 5,
    options: [
      'A) Quitar em ação',
      'B) Usar informações de fora do jogo para o jogo',
      'C) Atropelar alguém até a morte',
      'D) Fazer coisas impossíveis de fazer humanamente'
    ],
    answer: 'A'
  },

  {
    n: 9,
    text: 'O que é MG?',
    minutes: 5,
    options: [
      'A) Matar alguém sem motivo',
      'B) Fazer coisas impossíveis de fazer humanamente',
      'C) Atropelar alguém até a morte',
      'D) Usar informação de fora do jogo para o jogo'
    ],
    answer: 'D'
  },

  {
    n: 10,
    text: 'O que é PG?',
    minutes: 5,
    options: [
      'A) Matar alguém sem motivo',
      'B) Fazer coisas impossíveis de fazer humanamente',
      'C) Usar informação de fora do jogo para o jogo',
      'D) Atropelar alguém até a morte'
    ],
    answer: 'B'
  },

  {
    n: 11,
    text: 'O que pode agregar para a nossa facção?',
    minutes: 5
  }
];


// ======================================================
// CLIENT
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],

  partials: [
    Partials.Channel
  ]
});


// ======================================================
// SESSÕES
// ======================================================

const sessions = new Map();


// ======================================================
// FUNÇÕES
// ======================================================

function hasAnyRole(member, roleIds) {
  return roleIds.some(id => member.roles.cache.has(id));
}


function panelEmbed() {
  return new EmbedBuilder()
    .setTitle('📜 EDITAL — PAVUNA')
    .setDescription(
      '**Processo de Recrutamento Pavuna**\n\n' +
      'Clique no botão abaixo para iniciar seu edital. Um canal privado será criado somente para você e para a equipe responsável.\n\n' +

      '**Como funciona:**\n' +
      '• Responda cada pergunta dentro do tempo indicado.\n' +
      '• Nas questões de alternativas, utilize os botões A, B, C ou D.\n' +
      '• As mensagens das respostas serão apagadas automaticamente.\n' +
      '• Cada pergunta possui seu próprio cronômetro.\n' +
      '• Se o tempo acabar, o edital será encerrado como reprovado.\n' +
      '• Ao finalizar, o sistema fará a correção das questões objetivas.\n\n' +

      '🍀 **Boa sorte e atenção durante o edital!**'
    )
    .setImage(CONFIG.imageUrl)
    .setFooter({
      text: 'Pavuna • Sistema de Editais'
    });
}


function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('fazer_edital')
      .setLabel('Fazer Edital')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Primary)
  );
}


function startRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('iniciar_edital')
      .setLabel('Iniciar')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('fechar_edital')
      .setLabel('Fechar')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );
}


function answerButtons(questionNumber) {
  const letters = ['A', 'B', 'C', 'D'];

  return new ActionRowBuilder().addComponents(
    letters.map(letter =>
      new ButtonBuilder()
        .setCustomId(`edital_${questionNumber}_${letter}`)
        .setLabel(letter)
        .setStyle(ButtonStyle.Primary)
    )
  );
}


function fmtTime(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:T>`;
}


async function sendLog(guild, content) {
  if (!CONFIG.logChannelId) return;

  const channel = guild.channels.cache.get(CONFIG.logChannelId);

  if (channel?.isTextBased()) {
    await channel.send(content).catch(() => {});
  }
}


async function closeChannel(channel, reason = 'Edital encerrado') {
  await channel.send(
    `🔒 **${reason}**\nEste canal será fechado em 5 segundos.`
  ).catch(() => {});

  setTimeout(() => {
    channel.delete(reason).catch(() => {});
  }, CONFIG.closeAfterMs);
}


// ======================================================
// CRIAR CANAL DO EDITAL
// ======================================================

async function createEditalChannel(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  if (sessions.has(member.id)) {
    return interaction.reply({
      content: '❌ Você já possui um edital em andamento.',
      ephemeral: true
    });
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: ['ViewChannel']
    },

    ...CONFIG.editalAccessRoles.map(id => ({
      id,
      allow: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory'
      ]
    })),

    {
      id: member.id,
      allow: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory'
      ]
    }
  ];

  const channel = await guild.channels.create({
    name: `edital-${member.user.username}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 90),

    type: ChannelType.GuildText,

    parent: CONFIG.editalCategoryId || undefined,

    permissionOverwrites: overwrites,

    reason: `Edital iniciado por ${member.user.tag}`
  });

  sessions.set(member.id, {
    channelId: channel.id,
    candidateId: member.id,
    started: false,
    answers: [],
    objectiveCorrect: 0,
    currentQuestion: 0
  });

  const embed = new EmbedBuilder()
    .setTitle('📋 EDITAL PAVUNA')
    .setDescription(
      `Olá, ${member}! Este é o seu canal privado de edital.\n\n` +

      '**Antes de iniciar:**\n' +
      '• Leia cada pergunta com atenção.\n' +
      '• O cronômetro começa somente quando você clicar em **Iniciar**.\n' +
      '• Cada pergunta possui um tempo específico.\n' +
      '• Se o tempo acabar, o edital será encerrado como reprovado.\n' +
      '• Questões 1–5 e 11 são discursivas.\n' +
      '• Questões 6–10 possuem os botões A, B, C e D.\n' +
      '• Você precisa acertar todas as 5 questões objetivas para aprovação.\n\n' +

      'Boa sorte! 🍀'
    )
    .setFooter({
      text: 'Pavuna • Edital de Recrutamento'
    });

  await channel.send({
    content: `${member}`,
    embeds: [embed],
    components: [startRow()]
  });

  await interaction.reply({
    content: `✅ Seu canal de edital foi criado: ${channel}`,
    ephemeral: true
  });
}


// ======================================================
// REPROVAR POR TEMPO
// ======================================================

async function rejectByTimeout(channel, member, questionNumber) {
  await channel.send(
    `❌ **Tempo esgotado na pergunta ${questionNumber}.**\n\n` +
    'O edital foi encerrado e você foi **reprovado**.'
  );

  await sendLog(
    channel.guild,
    `📕 **EDITAL REPROVADO**\n` +
    `Membro: <@${member.id}>\n` +
    `Motivo: tempo esgotado na questão ${questionNumber}.`
  );

  sessions.delete(member.id);

  setTimeout(() => {
    channel.delete('Edital reprovado por tempo').catch(() => {});
  }, CONFIG.closeAfterMs);
}


// ======================================================
// EXECUTAR EDITAL
// ======================================================

async function runEdital(channel, member) {
  const session = sessions.get(member.id);

  if (!session || session.started) return;

  session.started = true;

  await channel.send(
    '🚀 **EDITAL INICIADO!**\n\n' +
    'Responda às perguntas dentro do tempo indicado.'
  );

  for (let i = 0; i < QUESTIONS.length; i++) {

    if (!sessions.has(member.id)) return;

    const q = QUESTIONS[i];

    session.currentQuestion = i + 1;

    const startedAt = new Date();

    const deadline = new Date(
      startedAt.getTime() + q.minutes * 60 * 1000
    );

    const lines = [
      `**${q.n}/11 — PERGUNTA ${q.n}/11**`,
      '',
      `**${q.text}**`,
      '',
      `⏱️ Tempo: **${q.minutes} minutos**`,
      `🟢 Início: ${fmtTime(startedAt)}`,
      `🔴 Término: ${fmtTime(deadline)}`
    ];

    // ==================================================
    // QUESTÕES COM BOTÕES
    // ==================================================

    if (q.options) {

      lines.push(
        '',
        `**A)** ${q.options[0].substring(3)}`,
        `**B)** ${q.options[1].substring(3)}`,
        `**C)** ${q.options[2].substring(3)}`,
        `**D)** ${q.options[3].substring(3)}`,
        '',
        '👇 **Escolha uma alternativa abaixo:**'
      );

      const questionMessage = await channel.send({
        content: lines.join('\n'),
        components: [answerButtons(q.n)]
      });

      const collected = await questionMessage
        .awaitMessageComponent({
          filter: buttonInteraction =>
            buttonInteraction.user.id === member.id &&
            buttonInteraction.customId.startsWith(`edital_${q.n}_`),

          time: q.minutes * 60 * 1000
        })
        .catch(() => null);

      if (!collected) {
        await questionMessage.delete().catch(() => {});
        await rejectByTimeout(channel, member, q.n);
        return;
      }

      const answer = collected.customId
        .split('_')
        .pop();

      session.answers.push({
        question: q.n,
        answer
      });

      if (answer === q.answer) {
        session.objectiveCorrect++;
      }

      // Responde ao clique antes de apagar a mensagem
      await collected.deferUpdate().catch(() => {});

      // Apaga a pergunta + botões
      await questionMessage.delete().catch(() => {});

      continue;
    }


    // ==================================================
    // QUESTÕES DISCURSIVAS
    // ==================================================

    const questionMessage = await channel.send(
      lines.join('\n') +
      '\n\n✍️ **Digite sua resposta abaixo:**'
    );

    const collected = await channel.awaitMessages({
      filter: message =>
        message.author.id === member.id,

      max: 1,

      time: q.minutes * 60 * 1000
    }).catch(() => null);


    // ==================================================
    // TEMPO ESGOTADO
    // ==================================================

    if (!collected || collected.size === 0) {

      await questionMessage.delete().catch(() => {});

      await rejectByTimeout(
        channel,
        member,
        q.n
      );

      return;
    }


    // ==================================================
    // PEGAR RESPOSTA
    // ==================================================

    const answerMessage = collected.first();

    const answer = answerMessage.content.trim();

    session.answers.push({
      question: q.n,
      answer
    });


    // ==================================================
    // APAGAR RESPOSTA DO CANDIDATO
    // E APAGAR PERGUNTA DO BOT
    // ==================================================

    await answerMessage.delete().catch(() => {});

    await questionMessage.delete().catch(() => {});
  }


  // ====================================================
  // FINALIZAR
  // ====================================================

  await finishEdital(
    channel,
    member,
    session
  );
}


// ======================================================
// FINAL DO EDITAL
// ======================================================

async function finishEdital(channel, member, session) {

  const approved =
    session.objectiveCorrect === 5;


  // ====================================================
  // APROVADO
  // ====================================================

  if (approved) {

    const roleResults = [];

    for (const roleId of CONFIG.approvedRoles) {

      const role =
        channel.guild.roles.cache.get(roleId);

      if (!role) continue;

      await member.roles
        .add(
          role,
          'Aprovado no edital Pavuna'
        )
        .then(() => roleResults.push(role.name))
        .catch(() => {});
    }


    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎉 EDITAL APROVADO!')
          .setDescription(
            `Parabéns, ${member}! Você foi **aprovado** no edital da Pavuna.\n\n` +

            `📊 Questões objetivas: **${session.objectiveCorrect}/5**\n` +

            `🏅 Cargos atribuídos: ${
              roleResults.length
                ? roleResults
                    .map(role => `**${role}**`)
                    .join(', ')
                : 'verifique a hierarquia do bot'
            }\n\n` +

            'Seja bem-vindo à Pavuna. Respeite as regras, a hierarquia e os demais membros!'
          )
          .setFooter({
            text: 'Pavuna • Recrutamento'
          })
      ]
    });


    await sendLog(
      channel.guild,
      `🎉 **APROVADO:** <@${member.id}> — ${session.objectiveCorrect}/5 nas objetivas.`
    );

  }


  // ====================================================
  // REPROVADO
  // ====================================================

  else {

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('📕 EDITAL REPROVADO')
          .setDescription(
            `Infelizmente, ${member}, você não atingiu a pontuação necessária.\n\n` +

            `📊 Questões objetivas: **${session.objectiveCorrect}/5**\n\n` +

            'Estude mais as regras do servidor e do RP e tente novamente em outro momento. Boa sorte na próxima!'
          )
          .setFooter({
            text: 'Pavuna • Recrutamento'
          })
      ]
    });


    await sendLog(
      channel.guild,
      `📕 **REPROVADO:** <@${member.id}> — ${session.objectiveCorrect}/5 nas objetivas.`
    );
  }


  sessions.delete(member.id);


  setTimeout(() => {
    channel.delete('Edital finalizado').catch(() => {});
  }, CONFIG.closeAfterMs);
}


// ======================================================
// COMANDOS
// ======================================================

function commandBuilders() {

  return [

    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Envia o painel de edital da Pavuna')

      .addSubcommand(sub =>
        sub
          .setName('edital')
          .setDescription('Enviar painel de edital')
      )

      .toJSON(),


    new SlashCommandBuilder()
      .setName('exoneracao')
      .setDescription('Exonera um membro e remove seus cargos')

      .addStringOption(option =>
        option
          .setName('motivo')
          .setDescription('Motivo da exoneração')
          .setRequired(true)
      )

      .addUserOption(option =>
        option
          .setName('membro')
          .setDescription('Membro a ser exonerado')
          .setRequired(true)
      )

      .toJSON(),


    new SlashCommandBuilder()
      .setName('promocao')
      .setDescription('Troca os cargos de um membro')

      .addUserOption(option =>
        option
          .setName('membro')
          .setDescription('Membro promovido')
          .setRequired(true)
      )

      .addRoleOption(option =>
        option
          .setName('cargo_antigo')
          .setDescription('Cargo antigo')
          .setRequired(true)
      )

      .addRoleOption(option =>
        option
          .setName('novo_cargo')
          .setDescription('Novo cargo')
          .setRequired(true)
      )

      .toJSON(),


    new SlashCommandBuilder()
      .setName('blacklist')
      .setDescription('Adiciona ou remove um membro da blacklist')

      .addUserOption(option =>
        option
          .setName('membro')
          .setDescription('Membro alvo')
          .setRequired(true)
      )

      .toJSON()
  ];
}


// ======================================================
// VERIFICAR CARGO
// ======================================================

function requireRole(interaction, allowed) {

  if (!hasAnyRole(interaction.member, allowed)) {

    interaction.reply({
      content:
        '❌ Você não possui o cargo necessário para usar este comando.',
      ephemeral: true
    });

    return false;
  }

  return true;
}


// ======================================================
// BOT ONLINE
// ======================================================

client.once('ready', async () => {

  console.log(
    `✅ Pavuna Bot online como ${client.user.tag}`
  );


  const rest = new REST({
    version: '10'
  }).setToken(
    process.env.DISCORD_TOKEN
  );


  const commands = commandBuilders();


  if (process.env.GUILD_ID) {

    await rest.put(
      Routes.applicationGuildCommands(
        client.user.id,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      '✅ Comandos registrados no servidor.'
    );

  } else {

    await rest.put(
      Routes.applicationCommands(
        client.user.id
      ),
      {
        body: commands
      }
    );

    console.log(
      '✅ Comandos globais registrados.'
    );
  }
});


// ======================================================
// INTERAÇÕES
// ======================================================

client.on(
  'interactionCreate',
  async interaction => {

    try {

      // ==================================================
      // SLASH COMMANDS
      // ==================================================

      if (interaction.isChatInputCommand()) {


        // ================================================
        // PAINEL
        // ================================================

        if (interaction.commandName === 'painel') {

          if (
            !requireRole(
              interaction,
              CONFIG.panelRoles
            )
          ) return;


          await interaction.channel.send({
            embeds: [
              panelEmbed()
            ],

            components: [
              panelRow()
            ]
          });


          return interaction.reply({
            content:
              '✅ Painel de edital enviado.',
            ephemeral: true
          });
        }


        // ================================================
        // EXONERAÇÃO
        // ================================================

        if (
          interaction.commandName ===
          'exoneracao'
        ) {

          if (
            !requireRole(
              interaction,
              CONFIG.exoneracaoAllowed
            )
          ) return;


          const target =
            interaction.options.getMember(
              'membro'
            );

          const motivo =
            interaction.options.getString(
              'motivo'
            );


          if (!target) {

            return interaction.reply({
              content:
                '❌ Não encontrei esse membro no servidor.',
              ephemeral: true
            });
          }


          if (
            target.id === interaction.user.id
          ) {

            return interaction.reply({
              content:
                '❌ Você não pode se exonerar por este comando.',
              ephemeral: true
            });
          }


          const removed = [];


          for (
            const role
            of target.roles.cache.values()
          ) {

            if (
              role.id === interaction.guild.id
            ) continue;

            if (
              CONFIG.exoneracaoKeepRoles
                .includes(role.id)
            ) continue;

            if (role.managed) continue;

            if (
              role.position >=
              interaction.guild.members.me.roles.highest.position
            ) continue;


            await target.roles
              .remove(
                role,
                `Exoneração por ${interaction.user.tag}: ${motivo}`
              )
              .then(() =>
                removed.push(role.name)
              )
              .catch(() => {});
          }


          await interaction.reply({

            embeds: [
              new EmbedBuilder()
                .setTitle(
                  '📤 Exoneração registrada'
                )

                .setDescription(
                  `👤 **Membro:** ${target}\n` +
                  `🛡️ **Responsável:** ${interaction.member}\n` +
                  `📝 **Motivo:** ${motivo}\n\n` +
                  `Cargos removidos: **${removed.length}**`
                )
            ]
          });


          await sendLog(
            interaction.guild,

            `📤 **EXONERAÇÃO**\n` +
            `Responsável: <@${interaction.user.id}>\n` +
            `Membro: <@${target.id}>\n` +
            `Motivo: ${motivo}`
          );

          return;
        }


        // ================================================
        // PROMOÇÃO
        // ================================================

        if (
          interaction.commandName ===
          'promocao'
        ) {

          if (
            !requireRole(
              interaction,
              CONFIG.promocaoAllowed
            )
          ) return;


          const target =
            interaction.options.getMember(
              'membro'
            );

          const oldRole =
            interaction.options.getRole(
              'cargo_antigo'
            );

          const newRole =
            interaction.options.getRole(
              'novo_cargo'
            );


          if (!target) {

            return interaction.reply({
              content:
                '❌ Não encontrei esse membro no servidor.',
              ephemeral: true
            });
          }


          if (
            !oldRole ||
            !newRole
          ) {

            return interaction.reply({
              content:
                '❌ Cargo inválido.',
              ephemeral: true
            });
          }


          if (
            newRole.position >=
            interaction.guild.members.me.roles.highest.position
          ) {

            return interaction.reply({
              content:
                '❌ O cargo novo está acima ou no mesmo nível do maior cargo do bot.',
              ephemeral: true
            });
          }


          await target.roles
            .remove(
              oldRole,
              `Promoção por ${interaction.user.tag}`
            )
            .catch(() => {});


          await target.roles
            .add(
              newRole,
              `Promoção por ${interaction.user.tag}`
            )
            .catch(() => {});


          const embed =
            new EmbedBuilder()
              .setTitle(
                '📈 PROMOÇÃO REGISTRADA'
              )

              .setDescription(
                `👤 **Membro:** ${target}\n` +
                `👑 **Responsável pela promoção:** ${interaction.member}\n` +
                `📉 **Antigo cargo:** ${oldRole}\n` +
                `📈 **Novo cargo:** ${newRole}\n\n` +

                'Parabéns pela promoção! Continue cumprindo suas funções e respeitando a hierarquia da Pavuna.'
              )

              .setFooter({
                text:
                  'Pavuna • Sistema de Promoções'
              });


          await interaction.reply({
            embeds: [embed]
          });


          await sendLog(
            interaction.guild,

            `📈 **PROMOÇÃO**\n` +
            `Responsável: <@${interaction.user.id}>\n` +
            `Membro: <@${target.id}>\n` +
            `Antigo: <@&${oldRole.id}>\n` +
            `Novo: <@&${newRole.id}>`
          );

          return;
        }


        // ================================================
        // BLACKLIST
        // ================================================

        if (
          interaction.commandName ===
          'blacklist'
        ) {

          if (
            !requireRole(
              interaction,
              CONFIG.blacklistAllowed
            )
          ) return;


          const user =
            interaction.options.getUser(
              'membro'
            );


          const ban =
            await interaction.guild.bans
              .fetch(user.id)
              .catch(() => null);


          if (ban) {

            await interaction.guild.members
              .unban(
                user.id,
                `Blacklist removida por ${interaction.user.tag}`
              )
              .catch(() => {});


            await interaction.reply(
              `✅ A blacklist de **${user.tag}** foi removida e o usuário foi desbanido.`
            );


            await sendLog(
              interaction.guild,

              `♻️ **BLACKLIST REMOVIDA:** ${user.tag} (${user.id}) por <@${interaction.user.id}>`
            );

          } else {

            await interaction.guild.members
              .ban(
                user.id,
                {
                  deleteMessageSeconds: 0,
                  reason:
                    `Blacklist por ${interaction.user.tag}`
                }
              )

              .then(async () => {

                await interaction.reply(
                  `⛔ **${user.tag}** foi colocado na blacklist e banido do servidor.`
                );


                await sendLog(
                  interaction.guild,

                  `⛔ **BLACKLIST:** ${user.tag} (${user.id}) por <@${interaction.user.id}>`
                );

              })

              .catch(async error => {

                await interaction.reply({
                  content:
                    `❌ Não foi possível banir o usuário. Verifique a hierarquia/permissão do bot.\n\`${error.message}\``,

                  ephemeral: true
                });

              });
          }
        }

        return;
      }


      // ==================================================
      // BOTÕES
      // ==================================================

      if (interaction.isButton()) {


        // ================================================
        // FAZER EDITAL
        // ================================================

        if (
          interaction.customId ===
          'fazer_edital'
        ) {

          return createEditalChannel(
            interaction
          );
        }


        const session =
          sessions.get(
            interaction.user.id
          );


        if (
          !session ||
          session.channelId !==
          interaction.channelId
        ) {

          return interaction.reply({
            content:
              '❌ Este edital não está ativo para você.',
            ephemeral: true
          });
        }


        // ================================================
        // FECHAR EDITAL
        // ================================================

        if (
          interaction.customId ===
          'fechar_edital'
        ) {

          sessions.delete(
            interaction.user.id
          );


          await interaction.reply(
            '🔒 Edital fechado. O canal será excluído em 5 segundos.'
          );


          return setTimeout(() => {

            interaction.channel
              .delete(
                'Edital fechado manualmente'
              )
              .catch(() => {});

          }, CONFIG.closeAfterMs);
        }


        // ================================================
        // INICIAR EDITAL
        // ================================================

        if (
          interaction.customId ===
          'iniciar_edital'
        ) {

          if (session.started) {

            return interaction.reply({
              content:
                '⚠️ O edital já foi iniciado.',
              ephemeral: true
            });
          }


          await interaction.deferUpdate();


          return runEdital(
            interaction.channel,
            interaction.member
          );
        }


        // ================================================
        // RESPOSTA A/B/C/D
        // ================================================

        if (
          interaction.customId.startsWith(
            'edital_'
          )
        ) {

          /*
           * As respostas A/B/C/D são tratadas
           * dentro de runEdital através do
           * awaitMessageComponent().
           *
           * Portanto, não fazemos nada aqui.
           */

          return;
        }
      }

    } catch (error) {

      console.error(error);


      if (
        interaction.isRepliable() &&
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({
          content:
            '❌ Ocorreu um erro interno. Confira o console do bot.',

          ephemeral: true
        }).catch(() => {});
      }
    }
  }
);


// ======================================================
// ERROS
// ======================================================

process.on(
  'unhandledRejection',
  console.error
);


// ======================================================
// LOGIN
// ======================================================

client.login(
  process.env.DISCORD_TOKEN
);