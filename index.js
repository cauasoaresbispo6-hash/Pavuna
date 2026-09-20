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
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

require('dotenv').config();

/* ======================================================
   CONFIGURAÇÃO
====================================================== */

const CONFIG = {
  imageUrl:
    'https://media.discordapp.net/attachments/1550653825659183144/1550714361973051474/Captura_de_tela_2026-09-19_004348.png?ex=6aaf56ca&is=6aae054a&hm=fd4f3deb9bbe0a581417d2504740aecfd43e72995527cc5bfb8804ec21f06eec&=&format=webp&quality=lossless',

  registrarImageUrl:
    'https://media.discordapp.net/attachments/1494717315743350836/1550919367339024384/648a4579-c535-4be5-b1ce-796cc37e6378.png?ex=6ab015b7&is=6aaec437&hm=9f3aaca3870b2a7156ada9d41fabb1613431204ea54008448c2199eb68baa925&=&format=webp&quality=lossless&width=768&height=317',

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
    '1550678827603329044',
    '1550893217027989654'
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

  editalCategoryId:
    process.env.EDITAL_CATEGORY_ID || null,

  logChannelId:
    process.env.LOG_CHANNEL_ID || null,

  closeAfterMs: 5000
};


/* ======================================================
   PERGUNTAS DO EDITAL
====================================================== */

const QUESTIONS = [
  {
    n: 1,
    text: 'Qual é o seu nome completo?',
    minutes: 3
  },

  {
    n: 2,
    text: 'Qual é o seu nick?',
    minutes: 3
  },

  {
    n: 3,
    text: 'Qual é o seu ID?',
    minutes: 3
  },

  {
    n: 4,
    text: 'Por que você quer entrar para nossa facção? Mínimo de 2 linhas.',
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
      'Matar alguém sem motivo',
      'Atropelar alguém sem motivo',
      'Usar informação de fora do jogo para o jogo',
      'Fazer coisas impossíveis de fazer humanamente'
    ],
    answer: 'A'
  },

  {
    n: 7,
    text: 'O que é VDM?',
    minutes: 5,
    options: [
      'Matar alguém sem motivo',
      'Usar informações de fora do jogo para o jogo',
      'Atropelar alguém até a morte',
      'Fazer coisas impossíveis de fazer humanamente'
    ],
    answer: 'C'
  },

  {
    n: 8,
    text: 'O que é CL?',
    minutes: 5,
    options: [
      'Quitar em ação',
      'Usar informações de fora do jogo para o jogo',
      'Atropelar alguém até a morte',
      'Fazer coisas impossíveis de fazer humanamente'
    ],
    answer: 'A'
  },

  {
    n: 9,
    text: 'O que é MG?',
    minutes: 5,
    options: [
      'Matar alguém sem motivo',
      'Fazer coisas impossíveis de fazer humanamente',
      'Atropelar alguém até a morte',
      'Usar informação de fora do jogo para o jogo'
    ],
    answer: 'D'
  },

  {
    n: 10,
    text: 'O que é PG?',
    minutes: 5,
    options: [
      'Matar alguém sem motivo',
      'Fazer coisas impossíveis de fazer humanamente',
      'Usar informação de fora do jogo para o jogo',
      'Atropelar alguém até a morte'
    ],
    answer: 'B'
  },

  {
    n: 11,
    text: 'O que você pode agregar para a nossa facção?',
    minutes: 5
  }
];


/* ======================================================
   CLIENT
====================================================== */

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


/* ======================================================
   SESSÕES
====================================================== */

const sessions = new Map();


/* ======================================================
   UTILITÁRIOS
====================================================== */

function hasAnyRole(member, roleIds) {
  return roleIds.some(id =>
    member.roles.cache.has(id)
  );
}


function formatTime(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:T>`;
}


function formatDuration(minutes) {
  return minutes === 1
    ? '1 minuto'
    : `${minutes} minutos`;
}


/* ======================================================
   PAINEL EDITAL
====================================================== */

function panelEmbed() {
  return new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle('📜 EDITAL • PAVUNA')
    .setDescription(
      [
        '### 🏴 Processo de Recrutamento',
        '',
        'Está preparado para fazer parte da **Pavuna**?',
        '',
        'Clique em **📜 Fazer Edital** para iniciar seu processo.',
        '',
        '**📌 Como funciona**',
        '> • Um canal privado será criado para você.',
        '> • Cada pergunta possui seu próprio tempo.',
        '> • Questões objetivas serão respondidas pelos botões.',
        '> • Questões discursivas devem ser respondidas por mensagem.',
        '> • As respostas enviadas serão apagadas automaticamente.',
        '> • O tempo será encerrado automaticamente.',
        '> • As questões objetivas precisam estar todas corretas.',
        '',
        '🍀 **Boa sorte!**'
      ].join('\n')
    )
    .setImage(CONFIG.imageUrl)
    .setFooter({
      text: 'Pavuna • Sistema Oficial de Recrutamento'
    })
    .setTimestamp();
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


/* ======================================================
   PAINEL REGISTRO
====================================================== */

function registrarEmbed() {
  return new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle('📋 REGISTRO • PAVUNA')
    .setDescription(
      [
        '### 🏴 Sistema de Registro',
        '',
        'Bem-vindo ao sistema oficial de registro da **Pavuna**.',
        '',
        'Clique no botão abaixo para realizar seu registro.',
        '',
        '**📌 Como funciona:**',
        '> 1. Clique em **📝 Registrar**.',
        '> 2. Informe seu **Nick**.',
        '> 3. Informe seu **ID**.',
        '> 4. Seu nome será atualizado automaticamente.',
        '',
        '**📋 Formato do nome:**',
        '> `⋆ 𝓟𝓥𝓝 ⋆ 𝓝𝓞𝓜𝓔 ⋆𝓘𝓓`',
        '',
        '**Exemplo:**',
        '> `⋆ 𝓟𝓥𝓝 ⋆ 𝓫𝓲𝓼𝓹𝓸 ⋆1325`',
        '',
        '⚠️ **Informe os dados corretamente.**'
      ].join('\n')
    )
    .setImage(CONFIG.registrarImageUrl)
    .setFooter({
      text: 'Pavuna • Sistema de Registro'
    })
    .setTimestamp();
}


function registrarRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_registro')
      .setLabel('Registrar')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary)
  );
}


async function abrirModalRegistro(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_registro')
    .setTitle('📋 Registro • Pavuna');

  const nickInput = new TextInputBuilder()
    .setCustomId('registro_nick')
    .setLabel('Qual é o seu Nick?')
    .setPlaceholder('Ex: bispo')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(20)
    .setRequired(true);

  const idInput = new TextInputBuilder()
    .setCustomId('registro_id')
    .setLabel('Qual é o seu ID?')
    .setPlaceholder('Ex: 1325')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(10)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nickInput),
    new ActionRowBuilder().addComponents(idInput)
  );

  return interaction.showModal(modal);
}


async function realizarRegistro(interaction) {
  const nick =
    interaction.fields
      .getTextInputValue('registro_nick')
      .trim();

  const id =
    interaction.fields
      .getTextInputValue('registro_id')
      .trim();

  if (!nick || !id) {
    return interaction.reply({
      content: '❌ Nick e ID são obrigatórios.',
      ephemeral: true
    });
  }

  if (!/^\d+$/.test(id)) {
    return interaction.reply({
      content: '❌ O ID deve conter somente números.',
      ephemeral: true
    });
  }

  const novoNome =
    `⋆ 𝓟𝓥𝓝 ⋆ ${nick} ⋆${id}`;

  if (novoNome.length > 32) {
    return interaction.reply({
      content:
        '❌ O nome ficou muito grande. Diminua o Nick e tente novamente.',
      ephemeral: true
    });
  }

  const member =
    interaction.member;

  if (!member || !member.manageable) {
    return interaction.reply({
      content:
        '❌ Não consigo alterar seu apelido. Verifique se o bot possui **Gerenciar Apelidos** e está acima do seu cargo.',
      ephemeral: true
    });
  }

  try {
    await member.setNickname(
      novoNome,
      `Registro Pavuna • ID ${id}`
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00cc66)
          .setTitle('✅ REGISTRO CONCLUÍDO')
          .setDescription(
            [
              `👤 **Membro:** ${member}`,
              '',
              `🏷️ **Nick:** ${nick}`,
              `🆔 **ID:** ${id}`,
              '',
              '**Novo nome:**',
              `> ${novoNome}`,
              '',
              '🎉 Seu registro foi realizado com sucesso!'
            ].join('\n')
          )
          .setFooter({
            text: 'Pavuna • Sistema de Registro'
          })
          .setTimestamp()
      ],
      ephemeral: true
    });

    await sendLog(
      interaction.guild,
      [
        '📝 **NOVO REGISTRO**',
        '',
        `👤 Membro: <@${member.id}>`,
        `🏷️ Nick: ${nick}`,
        `🆔 ID: ${id}`,
        `📋 Nome: ${novoNome}`
      ].join('\n')
    );

  } catch (error) {
    console.error(
      'Erro no registro:',
      error
    );

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content:
          '❌ Não foi possível alterar seu nome. Verifique a permissão **Gerenciar Apelidos** e a hierarquia do bot.',
        ephemeral: true
      });
    }
  }
}


/* ======================================================
   EDITAL
====================================================== */

function startRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('iniciar_edital')
      .setLabel('Iniciar Edital')
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
  return new ActionRowBuilder().addComponents(
    ['A', 'B', 'C', 'D'].map(letter =>
      new ButtonBuilder()
        .setCustomId(
          `edital_${questionNumber}_${letter}`
        )
        .setLabel(letter)
        .setStyle(ButtonStyle.Primary)
    )
  );
}


function questionEmbed(
  q,
  startedAt,
  deadline
) {
  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle(
      `📋 EDITAL PAVUNA • PERGUNTA ${String(q.n).padStart(2, '0')}/11`
    )
    .setDescription(
      [
        `### ❓ ${q.text}`,
        '',
        `⏱️ **Tempo:** ${formatDuration(q.minutes)}`,
        `🟢 **Início:** ${formatTime(startedAt)}`,
        `🔴 **Término:** ${formatTime(deadline)}`
      ].join('\n')
    )
    .setFooter({
      text: 'Pavuna • Processo Seletivo'
    });

  if (q.options) {
    embed.addFields({
      name: 'Escolha uma alternativa',
      value:
        `🅰️ **A)** ${q.options[0]}\n` +
        `🅱️ **B)** ${q.options[1]}\n` +
        `©️ **C)** ${q.options[2]}\n` +
        `🇩 **D)** ${q.options[3]}`
    });
  }

  return embed;
}


async function sendLog(
  guild,
  content
) {
  if (!CONFIG.logChannelId) return;

  const channel =
    guild.channels.cache.get(
      CONFIG.logChannelId
    );

  if (!channel?.isTextBased()) return;

  await channel.send({
    content
  }).catch(() => {});
}


async function deleteAfter(
  channel,
  reason
) {
  setTimeout(() => {
    channel.delete(reason)
      .catch(() => {});
  }, CONFIG.closeAfterMs);
}


async function closeChannel(
  channel,
  reason = 'Edital encerrado'
) {
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle('🔒 EDITAL ENCERRADO')
        .setDescription(
          'Este canal será excluído automaticamente em **5 segundos**.'
        )
        .setFooter({
          text: reason
        })
    ]
  }).catch(() => {});

  deleteAfter(
    channel,
    reason
  );
}


/* ======================================================
   CRIAR CANAL DO EDITAL
====================================================== */

async function createEditalChannel(
  interaction
) {
  const guild =
    interaction.guild;

  const member =
    interaction.member;

  if (!guild || !member) {
    return interaction.reply({
      content:
        '❌ Não foi possível iniciar o edital.',
      ephemeral: true
    });
  }

  if (sessions.has(member.id)) {
    const session =
      sessions.get(member.id);

    return interaction.reply({
      content:
        `❌ Você já possui um edital em andamento.\n\n` +
        `📋 Canal: <#${session.channelId}>`,
      ephemeral: true
    });
  }

  const botMember =
    guild.members.me;

  if (!botMember) {
    return interaction.reply({
      content:
        '❌ Não consegui verificar as permissões do bot.',
      ephemeral: true
    });
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    ...CONFIG.editalAccessRoles.map(
      roleId => ({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      })
    ),

    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    },

    {
      id: botMember.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels
      ]
    }
  ];

  const safeName =
    member.user.username
      .toLowerCase()
      .replace(
        /[^a-z0-9-]/g,
        '-'
      )
      .slice(0, 70);

  let channel;

  try {
    channel =
      await guild.channels.create({
        name:
          `edital-${safeName}`,
        type:
          ChannelType.GuildText,
        parent:
          CONFIG.editalCategoryId ||
          undefined,
        permissionOverwrites:
          overwrites,
        reason:
          `Edital iniciado por ${member.user.tag}`
      });

  } catch (error) {
    console.error(
      'Erro ao criar canal do edital:',
      error
    );

    return interaction.reply({
      content:
        '❌ Não consegui criar o canal do edital. Verifique as permissões do bot e a categoria configurada.',
      ephemeral: true
    });
  }

  sessions.set(
    member.id,
    {
      channelId:
        channel.id,

      candidateId:
        member.id,

      started:
        false,

      answers: [],

      objectiveCorrect:
        0,

      currentQuestion:
        0
    }
  );

  const embed =
    new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle(
        '📋 EDITAL PAVUNA'
      )
      .setDescription(
        [
          `Olá, ${member}!`,
          '',
          'Seu canal privado de recrutamento foi criado.',
          '',
          '### ⚠️ Antes de começar',
          '',
          '• Leia todas as perguntas com atenção.',
          '• O cronômetro começa ao clicar em **Iniciar Edital**.',
          '• Cada pergunta possui um tempo próprio.',
          '• Se o tempo acabar, o processo será encerrado.',
          '• Questões **1–5 e 11** são discursivas.',
          '• Questões **6–10** possuem alternativas.',
          '• É necessário acertar as **5 questões objetivas**.',
          '',
          'Quando estiver pronto, clique em **▶️ Iniciar Edital**.',
          '',
          '🍀 **Boa sorte!**'
        ].join('\n')
      )
      .setFooter({
        text:
          'Pavuna • Sistema de Recrutamento'
      })
      .setTimestamp();

  await channel.send({
    content:
      `${member}`,
    embeds: [
      embed
    ],
    components: [
      startRow()
    ]
  });

  await interaction.reply({
    content:
      `✅ Seu edital foi criado com sucesso!\n\n` +
      `📋 Acesse: ${channel}`,
    ephemeral: true
  });
}


/* ======================================================
   REPROVAR POR TEMPO
====================================================== */

async function rejectByTimeout(
  channel,
  member,
  questionNumber
) {
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(
          '⏰ TEMPO ESGOTADO'
        )
        .setDescription(
          `O tempo da **pergunta ${questionNumber}/11** acabou.\n\n` +
          `❌ **Edital reprovado.**`
        )
        .setFooter({
          text:
            'Pavuna • Processo Seletivo'
        })
    ]
  }).catch(() => {});

  await sendLog(
    channel.guild,
    [
      '📕 **EDITAL REPROVADO**',
      '',
      `👤 Membro: <@${member.id}>`,
      `❌ Motivo: tempo esgotado na questão ${questionNumber}/11.`
    ].join('\n')
  );

  sessions.delete(
    member.id
  );

  deleteAfter(
    channel,
    'Edital reprovado por tempo'
  );
}


/* ======================================================
   EXECUTAR EDITAL
====================================================== */

async function runEdital(
  channel,
  member
) {
  const session =
    sessions.get(
      member.id
    );

  if (!session) return;

  if (session.started)
    return;

  session.started =
    true;

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00aa55)
        .setTitle(
          '🚀 EDITAL INICIADO'
        )
        .setDescription(
          'O processo seletivo começou!\n\n' +
          'Responda cada pergunta dentro do tempo indicado.'
        )
    ]
  });

  for (const q of QUESTIONS) {

    if (!sessions.has(member.id))
      return;

    session.currentQuestion =
      q.n;

    const startedAt =
      new Date();

    const deadline =
      new Date(
        startedAt.getTime() +
        q.minutes *
        60 *
        1000
      );


    /* ================================================
       OBJETIVAS
    ================================================ */

    if (q.options) {

      const questionMessage =
        await channel.send({
          embeds: [
            questionEmbed(
              q,
              startedAt,
              deadline
            )
          ],
          components: [
            answerButtons(q.n)
          ]
        });

      const collected =
        await questionMessage
          .awaitMessageComponent({
            filter:
              buttonInteraction =>
                buttonInteraction.user.id ===
                member.id &&
                buttonInteraction.customId.startsWith(
                  `edital_${q.n}_`
                ),

            time:
              q.minutes *
              60 *
              1000

          })
          .catch(
            () => null
          );

      if (!collected) {

        await questionMessage
          .delete()
          .catch(() => {});

        await rejectByTimeout(
          channel,
          member,
          q.n
        );

        return;
      }

      const answer =
        collected.customId
          .split('_')
          .pop();

      session.answers.push({
        question:
          q.n,
        answer
      });

      if (
        answer ===
        q.answer
      ) {
        session.objectiveCorrect++;
      }

      await collected
        .deferUpdate()
        .catch(() => {});

      await questionMessage
        .delete()
        .catch(() => {});

      continue;
    }


    /* ================================================
       DISCURSIVAS
    ================================================ */

    const questionMessage =
      await channel.send({
        embeds: [
          questionEmbed(
            q,
            startedAt,
            deadline
          )
        ],
        content:
          '✍️ **Digite sua resposta abaixo:**'
      });

    const collected =
      await channel.awaitMessages({
        filter:
          message =>
            message.author.id ===
            member.id &&
            !message.author.bot,

        max:
          1,

        time:
          q.minutes *
          60 *
          1000

      }).catch(
        () => null
      );

    if (
      !collected ||
      collected.size === 0
    ) {

      await questionMessage
        .delete()
        .catch(() => {});

      await rejectByTimeout(
        channel,
        member,
        q.n
      );

      return;
    }

    const answerMessage =
      collected.first();

    const answer =
      answerMessage
        .content
        .trim();

    session.answers.push({
      question:
        q.n,
      answer
    });

    await answerMessage
      .delete()
      .catch(() => {});

    await questionMessage
      .delete()
      .catch(() => {});
  }

  await finishEdital(
    channel,
    member,
    session
  );
}


/* ======================================================
   FINALIZAR EDITAL
====================================================== */

async function finishEdital(
  channel,
  member,
  session
) {
  const approved =
    session.objectiveCorrect === 5;

  if (approved) {

    const roleResults = [];

    for (
      const roleId of
      CONFIG.approvedRoles
    ) {

      const role =
        channel.guild.roles.cache.get(
          roleId
        );

      if (!role)
        continue;

      if (
        role.position >=
        channel.guild.members.me.roles.highest.position
      ) {

        console.warn(
          `Cargo ${role.name} está acima do bot.`
        );

        continue;
      }

      try {

        await member.roles.add(
          role,
          'Aprovado no edital Pavuna'
        );

        roleResults.push(
          role.name
        );

      } catch (error) {

        console.error(
          `Erro ao adicionar cargo ${roleId}:`,
          error
        );
      }
    }

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00cc66)
          .setTitle(
            '🎉 EDITAL APROVADO!'
          )
          .setDescription(
            [
              `Parabéns, ${member}!`,
              '',
              'Você foi **aprovado** no processo seletivo da **Pavuna**.',
              '',
              `📊 **Questões objetivas:** ${session.objectiveCorrect}/5`,
              '',
              '🏅 **Cargos atribuídos:**',
              roleResults.length
                ? roleResults
                    .map(
                      role =>
                        `> • **${role}**`
                    )
                    .join('\n')
                : '> ⚠️ Nenhum cargo pôde ser atribuído.',
              '',
              '━━━━━━━━━━━━━━━━━━━━',
              '',
              '🏴 **Bem-vindo à Pavuna!**',
              'Respeite as regras, a hierarquia e os demais membros.'
            ].join('\n')
          )
          .setFooter({
            text:
              'Pavuna • Recrutamento'
          })
          .setTimestamp()
      ]
    });

    await sendLog(
      channel.guild,
      [
        '🎉 **EDITAL APROVADO**',
        '',
        `👤 Membro: <@${member.id}>`,
        `📊 Resultado: ${session.objectiveCorrect}/5`,
        `🏅 Cargos atribuídos: ${roleResults.length}`
      ].join('\n')
    );

  } else {

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff3333)
          .setTitle(
            '📕 EDITAL REPROVADO'
          )
          .setDescription(
            [
              `Infelizmente, ${member}, você não atingiu a pontuação necessária.`,
              '',
              `📊 **Questões objetivas:** ${session.objectiveCorrect}/5`,
              '',
              'É necessário acertar as **5 questões objetivas**.',
              '',
              '📚 Estude as regras do servidor e do RP e tente novamente em outro momento.',
              '',
              'Boa sorte na próxima tentativa!'
            ].join('\n')
          )
          .setFooter({
            text:
              'Pavuna • Recrutamento'
          })
          .setTimestamp()
      ]
    });

    await sendLog(
      channel.guild,
      [
        '📕 **EDITAL REPROVADO**',
        '',
        `👤 Membro: <@${member.id}>`,
        `📊 Resultado: ${session.objectiveCorrect}/5`
      ].join('\n')
    );
  }

  sessions.delete(
    member.id
  );

  deleteAfter(
    channel,
    'Edital finalizado'
  );
}


/* ======================================================
   COMANDOS
====================================================== */

function commandBuilders() {
  return [

    new SlashCommandBuilder()
      .setName('painel')
      .setDescription(
        'Gerencia o painel da Pavuna'
      )

      .addSubcommand(sub =>
        sub
          .setName('edital')
          .setDescription(
            'Envia o painel de recrutamento'
          )
      )

      .addSubcommand(sub =>
        sub
          .setName('registrar')
          .setDescription(
            'Envia o painel de registro'
          )
      )

      .toJSON(),


    new SlashCommandBuilder()
      .setName('exoneracao')
      .setDescription(
        'Exonera um membro'
      )

      .addStringOption(option =>
        option
          .setName('motivo')
          .setDescription(
            'Motivo da exoneração'
          )
          .setRequired(true)
      )

      .addUserOption(option =>
        option
          .setName('membro')
          .setDescription(
            'Membro a ser exonerado'
          )
          .setRequired(true)
      )

      .toJSON(),


    new SlashCommandBuilder()
      .setName('promocao')
      .setDescription(
        'Promove um membro'
      )

      .addUserOption(option =>
        option
          .setName('membro')
          .setDescription(
            'Membro promovido'
          )
          .setRequired(true)
      )

      .addRoleOption(option =>
        option
          .setName('cargo_antigo')
          .setDescription(
            'Cargo antigo'
          )
          .setRequired(true)
      )

      .addRoleOption(option =>
        option
          .setName('novo_cargo')
          .setDescription(
            'Novo cargo'
          )
          .setRequired(true)
      )

      .toJSON(),


    new SlashCommandBuilder()
      .setName('blacklist')
      .setDescription(
        'Adiciona ou remove um usuário da blacklist'
      )

      .addUserOption(option =>
        option
          .setName('membro')
          .setDescription(
            'Usuário alvo'
          )
          .setRequired(true)
      )

      .toJSON()
  ];
}


/* ======================================================
   PERMISSÃO POR CARGO
====================================================== */

async function requireRole(
  interaction,
  allowedRoles
) {

  if (
    !hasAnyRole(
      interaction.member,
      allowedRoles
    )
  ) {

    await interaction.reply({
      content:
        '❌ Você não possui o cargo necessário para utilizar este comando.',
      ephemeral: true
    });

    return false;
  }

  return true;
}


/* ======================================================
   READY
====================================================== */

client.once(
  'ready',
  async () => {

    console.log(
      `✅ Pavuna conectado como ${client.user.tag}`
    );

    const rest =
      new REST({
        version: '10'
      }).setToken(
        process.env.DISCORD_TOKEN
      );

    const commands =
      commandBuilders();

    try {

      if (
        process.env.GUILD_ID
      ) {

        await rest.put(
          Routes.applicationGuildCommands(
            client.user.id,
            process.env.GUILD_ID
          ),
          {
            body:
              commands
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
            body:
              commands
          }
        );

        console.log(
          '✅ Comandos globais registrados.'
        );
      }

    } catch (error) {

      console.error(
        '❌ Erro ao registrar comandos:',
        error
      );
    }
  }
);


/* ======================================================
   INTERAÇÕES
====================================================== */

client.on(
  'interactionCreate',
  async interaction => {

    try {

      /* ================================================
         SLASH COMMANDS
      ================================================ */

      if (
        interaction.isChatInputCommand()
      ) {

        /* -----------------------------------------------
           PAINEL
        ----------------------------------------------- */

        if (
          interaction.commandName ===
          'painel'
        ) {

          if (
            !await requireRole(
              interaction,
              CONFIG.panelRoles
            )
          ) return;

          const tipo =
            interaction.options
              .getSubcommand();


          /* ============================================
             PAINEL REGISTRO
          ============================================ */

          if (
            tipo ===
            'registrar'
          ) {

            await interaction.channel.send({
              embeds: [
                registrarEmbed()
              ],
              components: [
                registrarRow()
              ]
            });

            return interaction.reply({
              content:
                '✅ Painel de registro enviado com sucesso.',
              ephemeral: true
            });
          }


          /* ============================================
             PAINEL EDITAL
          ============================================ */

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
              '✅ Painel de edital enviado com sucesso.',
            ephemeral: true
          });
        }


        /* -----------------------------------------------
           EXONERAÇÃO
        ----------------------------------------------- */

        if (
          interaction.commandName ===
          'exoneracao'
        ) {

          if (
            !await requireRole(
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
            target.id ===
            interaction.user.id
          ) {

            return interaction.reply({
              content:
                '❌ Você não pode se exonerar.',
              ephemeral: true
            });
          }

          const botMember =
            interaction.guild.members.me;

          if (!botMember) {

            return interaction.reply({
              content:
                '❌ Não consegui verificar a hierarquia do bot.',
              ephemeral: true
            });
          }

          const removed = [];

          for (
            const role of
            target.roles.cache.values()
          ) {

            if (
              role.id ===
              interaction.guild.id
            ) continue;

            if (
              CONFIG.exoneracaoKeepRoles
                .includes(role.id)
            ) continue;

            if (
              role.managed
            ) continue;

            if (
              role.position >=
              botMember.roles.highest.position
            ) continue;

            try {

              await target.roles.remove(
                role,
                `Exoneração por ${interaction.user.tag}: ${motivo}`
              );

              removed.push(
                role.name
              );

            } catch {}
          }

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff3333)
                .setTitle(
                  '📤 EXONERAÇÃO REGISTRADA'
                )
                .setDescription(
                  [
                    `👤 **Membro:** ${target}`,
                    `🛡️ **Responsável:** ${interaction.member}`,
                    `📝 **Motivo:** ${motivo}`,
                    '',
                    `📋 **Cargos removidos:** ${removed.length}`
                  ].join('\n')
                )
                .setFooter({
                  text:
                    'Pavuna • Administração'
                })
                .setTimestamp()
            ]
          });

          await sendLog(
            interaction.guild,
            [
              '📤 **EXONERAÇÃO**',
              '',
              `🛡️ Responsável: <@${interaction.user.id}>`,
              `👤 Membro: <@${target.id}>`,
              `📝 Motivo: ${motivo}`,
              `📋 Cargos removidos: ${removed.length}`
            ].join('\n')
          );

          return;
        }


        /* -----------------------------------------------
           PROMOÇÃO
        ----------------------------------------------- */

        if (
          interaction.commandName ===
          'promocao'
        ) {

          if (
            !await requireRole(
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
                '❌ Não encontrei esse membro.',
              ephemeral: true
            });
          }

          if (
            !oldRole ||
            !newRole
          ) {

            return interaction.reply({
              content:
                '❌ Um dos cargos informados é inválido.',
              ephemeral: true
            });
          }

          if (
            oldRole.id ===
            newRole.id
          ) {

            return interaction.reply({
              content:
                '❌ O cargo antigo e o novo cargo não podem ser iguais.',
              ephemeral: true
            });
          }

          const botMember =
            interaction.guild.members.me;

          if (
            !botMember ||
            newRole.position >=
            botMember.roles.highest.position
          ) {

            return interaction.reply({
              content:
                '❌ O novo cargo está acima ou no mesmo nível do maior cargo do bot.',
              ephemeral: true
            });
          }

          if (
            !target.roles.cache.has(
              oldRole.id
            )
          ) {

            return interaction.reply({
              content:
                `❌ O membro não possui o cargo ${oldRole}.`,
              ephemeral: true
            });
          }

          try {

            await target.roles.remove(
              oldRole,
              `Promoção por ${interaction.user.tag}`
            );

            await target.roles.add(
              newRole,
              `Promoção por ${interaction.user.tag}`
            );

          } catch (error) {

            console.error(error);

            return interaction.reply({
              content:
                '❌ Não foi possível alterar os cargos. Verifique a hierarquia do bot.',
              ephemeral: true
            });
          }

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00aaff)
                .setTitle(
                  '📈 PROMOÇÃO REGISTRADA'
                )
                .setDescription(
                  [
                    `👤 **Membro:** ${target}`,
                    `👑 **Responsável:** ${interaction.member}`,
                    '',
                    `📉 **Cargo anterior:** ${oldRole}`,
                    `📈 **Novo cargo:** ${newRole}`,
                    '',
                    '🎉 Parabéns pela promoção!'
                  ].join('\n')
                )
                .setFooter({
                  text:
                    'Pavuna • Sistema de Promoções'
                })
                .setTimestamp()
            ]
          });

          await sendLog(
            interaction.guild,
            [
              '📈 **PROMOÇÃO**',
              '',
              `👑 Responsável: <@${interaction.user.id}>`,
              `👤 Membro: <@${target.id}>`,
              `📉 Antigo: <@&${oldRole.id}>`,
              `📈 Novo: <@&${newRole.id}>`
            ].join('\n')
          );

          return;
        }


        /* -----------------------------------------------
           BLACKLIST
        ----------------------------------------------- */

        if (
          interaction.commandName ===
          'blacklist'
        ) {

          if (
            !await requireRole(
              interaction,
              CONFIG.blacklistAllowed
            )
          ) return;

          const user =
            interaction.options.getUser(
              'membro'
            );

          const existingBan =
            await interaction.guild.bans
              .fetch(user.id)
              .catch(() => null);

          if (existingBan) {

            try {

              await interaction.guild.members.unban(
                user.id,
                `Blacklist removida por ${interaction.user.tag}`
              );

              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0x00cc66)
                    .setTitle(
                      '♻️ BLACKLIST REMOVIDA'
                    )
                    .setDescription(
                      `O usuário **${user.tag}** foi desbanido.`
                    )
                    .setTimestamp()
                ]
              });

              await sendLog(
                interaction.guild,
                `♻️ **BLACKLIST REMOVIDA**\n👤 ${user.tag} (${user.id})\n🛡️ Responsável: <@${interaction.user.id}>`
              );

            } catch (error) {

              await interaction.reply({
                content:
                  '❌ Não foi possível remover a blacklist.',
                ephemeral: true
              });
            }

          } else {

            try {

              await interaction.guild.members.ban(
                user.id,
                {
                  deleteMessageSeconds:
                    0,

                  reason:
                    `Blacklist por ${interaction.user.tag}`
                }
              );

              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(
                      '⛔ BLACKLIST APLICADA'
                    )
                    .setDescription(
                      `**${user.tag}** foi colocado na blacklist.`
                    )
                    .setTimestamp()
                ]
              });

              await sendLog(
                interaction.guild,
                `⛔ **BLACKLIST**\n👤 ${user.tag} (${user.id})\n🛡️ Responsável: <@${interaction.user.id}>`
              );

            } catch (error) {

              await interaction.reply({
                content:
                  '❌ Não foi possível banir o usuário. Verifique a permissão de banir membros e a hierarquia do bot.',
                ephemeral: true
              });
            }
          }

          return;
        }

        return;
      }


      /* ================================================
         MODAL DE REGISTRO
      ================================================ */

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
        'modal_registro'
      ) {

        return realizarRegistro(
          interaction
        );
      }


      /* ================================================
         BOTÕES
      ================================================ */

      if (
        interaction.isButton()
      ) {

        /* -----------------------------------------------
           BOTÃO REGISTRAR
        ----------------------------------------------- */

        if (
          interaction.customId ===
          'abrir_registro'
        ) {

          return abrirModalRegistro(
            interaction
          );
        }


        /* -----------------------------------------------
           FAZER EDITAL
        ----------------------------------------------- */

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


        /* -----------------------------------------------
           BOTÃO FECHAR EDITAL
        ----------------------------------------------- */

        if (
          interaction.customId ===
          'fechar_edital'
        ) {

          const isCandidate =
            session &&
            session.channelId ===
            interaction.channelId;

          const canManage =
            hasAnyRole(
              interaction.member,
              CONFIG.editalAccessRoles
            );

          if (
            !isCandidate &&
            !canManage
          ) {

            return interaction.reply({
              content:
                '❌ Você não possui permissão para fechar este edital.',
              ephemeral: true
            });
          }

          if (session) {

            sessions.delete(
              interaction.user.id
            );
          }

          await interaction.reply({
            content:
              '🔒 Edital encerrado. O canal será excluído em 5 segundos.'
          });

          return deleteAfter(
            interaction.channel,
            'Edital fechado manualmente'
          );
        }


        /* -----------------------------------------------
           INICIAR EDITAL
        ----------------------------------------------- */

        if (
          interaction.customId ===
          'iniciar_edital'
        ) {

          if (!session) {

            return interaction.reply({
              content:
                '❌ Este edital não está mais ativo.',
              ephemeral: true
            });
          }

          if (
            session.channelId !==
            interaction.channelId
          ) {

            return interaction.reply({
              content:
                '❌ Este não é o seu canal de edital.',
              ephemeral: true
            });
          }

          if (
            session.started
          ) {

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


        /* -----------------------------------------------
           BOTÕES A/B/C/D
        ----------------------------------------------- */

        if (
          interaction.customId.startsWith(
            'edital_'
          )
        ) {

          return;
        }
      }

    } catch (error) {

      console.error(
        'Erro na interação:',
        error
      );

      if (
        interaction.isRepliable() &&
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({
          content:
            '❌ Ocorreu um erro interno. Verifique os logs do bot.',
          ephemeral: true
        }).catch(
          () => {}
        );
      }
    }
  }
);


/* ======================================================
   ERROS DO PROCESSO
====================================================== */

process.on(
  'unhandledRejection',
  error => {
    console.error(
      '❌ Unhandled Rejection:',
      error
    );
  }
);


process.on(
  'uncaughtException',
  error => {
    console.error(
      '❌ Uncaught Exception:',
      error
    );
  }
);


/* ======================================================
   LOGIN
====================================================== */

if (
  !process.env.DISCORD_TOKEN
) {

  console.error(
    '❌ DISCORD_TOKEN não foi configurado no Railway.'
  );

  process.exit(1);
}


client.login(
  process.env.DISCORD_TOKEN
);
