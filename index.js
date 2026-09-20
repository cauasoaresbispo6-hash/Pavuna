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
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const CONFIG = {

  /* IMAGENS */

  editalImage:
    'https://media.discordapp.net/attachments/1550653825659183144/1550714361973051474/Captura_de_tela_2026-09-19_004348.png?ex=6aaf56ca&is=6aae054&hm=fd4f3deb9bbe0a581417d2504740aecfd43e72995527cc5bfb8804ec21f06eec&=&format=webp&quality=lossless',

  registrarImage:
    'https://media.discordapp.net/attachments/1494717315743350836/1550919367339024384/648a4579-c535-4be5-b1ce-796cc37e6378.png?ex=6ab015b7&is=6aaec437&hm=9f3aaca3870b2a7156ada9d41fabb1613431204ea54008448c2199eb68baa925&=&format=webp&quality=lossless&width=768&height=317',

  ticketImage:
    'https://media.discordapp.net/attachments/1551129943394492526/1551271126146093157/image.png?ex=6ab15d51&is=6ab00bd1&hm=dfb73fb6da0e56285dd3794dbefb774983871379aee0d5439575bff275610549&=&format=webp&quality=lossless',

  /* CARGOS ADMINISTRATIVOS */

  adminRoles: [
    '1550615266046644259',
    '1550615266046644258',
    '1550615266046644257'
  ],

  /* CARGOS COM ACESSO AO EDITAL */

  editalAccessRoles: [
    '1550615266030002192',
    '1550615266030002193'
  ],

  /* CARGOS RECEBIDOS AO PASSAR NO EDITAL */

  approvedRoles: [
    '1550615266004574308',
    '1550615265954373758',
    '1550678827603329044',
    '1550893217027989654'
  ],

  /* CARGOS QUE PERMANECEM NA EXONERAÇÃO */

  exoneracaoKeepRoles: [
    '1550615265954373757',
    '1550615265954373756'
  ],

  /* CARGOS DO TICKET */

  ticketStaffRoles: [
    '1550615266030002188',
    '1550615266046644257',
    '1550615266046644259'
  ],

  /* CATEGORIA DOS TICKETS - OPCIONAL */

  ticketCategoryId:
    process.env.TICKET_CATEGORY_ID || null,

  /* CATEGORIA DO EDITAL - OPCIONAL */

  editalCategoryId:
    process.env.EDITAL_CATEGORY_ID || null,

  /* LOG */

  logChannelId:
    process.env.LOG_CHANNEL_ID || null,

  /* TEMPO PARA EXCLUIR CANAIS */

  closeAfterMs: 5000,

  /* CANAIS DE VOZ DO BATE-PONTO */

  pontoVoiceChannels: [
    '1550686696671281252',
    '1550687590657564672',
    '1550615268969938970',
    '1550615268969938971',
    '1550615268969938972',
    '1550615269376790579',
    '1550615269376790580',
    '1550615269376790581',
    '1550615268969938973',
    '1550615269376790578'
  ],

  /* META SEMANAL: 7 HORAS */

  pontoMetaSemanalMs:
    7 * 60 * 60 * 1000
};


/* =========================================================
   ARQUIVO DO BATE-PONTO
========================================================= */

const pontosFile =
  path.join(__dirname, 'pontos.json');

if (!fs.existsSync(pontosFile)) {
  fs.writeFileSync(
    pontosFile,
    JSON.stringify({}, null, 2)
  );
}

let pontos = {};

try {
  pontos =
    JSON.parse(
      fs.readFileSync(pontosFile, 'utf8')
    );
} catch {
  pontos = {};
}

const pontosAtivos = new Map();


function salvarPontos() {
  fs.writeFileSync(
    pontosFile,
    JSON.stringify(pontos, null, 2)
  );
}


/* =========================================================
   FUNÇÕES GERAIS
========================================================= */

function formatarTempo(ms) {
  const totalSeconds =
    Math.max(0, Math.floor(ms / 1000));

  const horas =
    Math.floor(totalSeconds / 3600);

  const minutos =
    Math.floor((totalSeconds % 3600) / 60);

  const segundos =
    totalSeconds % 60;

  return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
}


function getSemanaAtual() {
  const agora = new Date();

  const dia =
    agora.getDay();

  const diff =
    dia === 0 ? -6 : 1 - dia;

  const segunda =
    new Date(agora);

  segunda.setDate(
    agora.getDate() + diff
  );

  segunda.setHours(
    0,
    0,
    0,
    0
  );

  return segunda
    .toISOString()
    .slice(0, 10);
}


function garantirMembroPonto(userId) {
  const semanaAtual =
    getSemanaAtual();

  if (!pontos[userId]) {
    pontos[userId] = {
      semana: semanaAtual,
      semanal: 0,
      total: 0
    };
  }

  if (pontos[userId].semana !== semanaAtual) {
    pontos[userId].semana = semanaAtual;
    pontos[userId].semanal = 0;
  }

  return pontos[userId];
}


function membroTemAdmin(member) {
  return CONFIG.adminRoles.some(
    roleId =>
      member.roles.cache.has(roleId)
  );
}


function membroTemTicketStaff(member) {
  return CONFIG.ticketStaffRoles.some(
    roleId =>
      member.roles.cache.has(roleId)
  );
}


function ticketSafeName(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}


async function sendLog(guild, content) {
  if (!CONFIG.logChannelId) {
    return;
  }

  try {
    const channel =
      await guild.channels.fetch(
        CONFIG.logChannelId
      );

    if (channel) {
      await channel.send({
        content
      });
    }
  } catch (error) {
    console.error(
      'Erro ao enviar log:',
      error
    );
  }
}


/* =========================================================
   EDITAL
========================================================= */

const editalQuestions = [
  {
    text: 'Nome completo',
    time: 3
  },

  {
    text: 'Nick',
    time: 3
  },

  {
    text: 'ID',
    time: 3
  },

  {
    text: 'Por que quer entrar para nossa Facção? Mínimo 2 linhas.',
    time: 5
  },

  {
    text: 'Já participou de alguma fac/corp? Se sim, qual e quanto tempo ficou nela.',
    time: 5
  },

  {
    text:
      'O que é RDM?\n\nA) Matar sem motivo\nB) Atropelar sem motivo\nC) Usar informação de fora do jogo para o jogo\nD) Fazer coisas impossíveis humanamente',
    time: 5,
    answer: 'A'
  },

  {
    text:
      'O que é VDM?\n\nA) Matar sem motivo\nB) Usar informação de fora para jogo\nC) Atropelar alguém até a morte\nD) Fazer coisas impossíveis humanamente',
    time: 5,
    answer: 'C'
  },

  {
    text:
      'O que é CL?\n\nA) Quitar em ação\nB) Usar informação de fora\nC) Atropelar até morte\nD) Fazer coisas impossíveis humanamente',
    time: 5,
    answer: 'A'
  },

  {
    text:
      'O que é MG?\n\nA) Matar sem motivo\nB) Fazer coisas impossíveis\nC) Atropelar até morte\nD) Usar informação de fora para jogo',
    time: 5,
    answer: 'D'
  },

  {
    text:
      'O que é PG?\n\nA) Matar sem motivo\nB) Fazer coisas impossíveis\nC) Usar informação de fora para jogo\nD) Atropelar até morte',
    time: 5,
    answer: 'B'
  },

  {
    text:
      'O que pode agregar para nossa facção?',
    time: 5
  }
];


const editaisAtivos = new Map();


function editalPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('📜 EDITAL DE RECRUTAMENTO')
    .setDescription(
      'Deseja fazer parte da nossa facção?\n\n' +
      'Clique no botão abaixo para iniciar seu edital.\n\n' +
      '📌 Responda todas as perguntas com atenção.\n' +
      '⏱️ Cada pergunta possui um tempo limite.\n' +
      '⚠️ Caso o tempo termine, o edital será encerrado.'
    )
    .setColor(0x111111)
    .setImage(CONFIG.editalImage)
    .setFooter({
      text: 'Pavuna • Recrutamento'
    });
}


function editalPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_edital')
      .setLabel('Fazer Edital')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Primary)
  );
}


async function closeEditalChannel(channel) {
  setTimeout(async () => {
    try {
      await channel.delete();
    } catch {}
  }, CONFIG.closeAfterMs);
}


async function createEditalChannel(interaction) {
  const guild =
    interaction.guild;

  const member =
    interaction.member;

  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildText &&
        channel.topic?.includes(
          `editalOwner:${member.id}`
        )
    );

  if (existing) {
    return interaction.reply({
      content:
        `❌ Você já possui um edital aberto: ${existing}`,
      ephemeral: true
    });
  }

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
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
    )
  ];

  const options = {
    name:
      `edital-${ticketSafeName(member.displayName || member.user.username)}`.slice(0, 100),

    type: ChannelType.GuildText,

    topic:
      `editalOwner:${member.id}`,

    permissionOverwrites
  };

  if (CONFIG.editalCategoryId) {
    options.parent =
      CONFIG.editalCategoryId;
  }

  const channel =
    await guild.channels.create(options);

  const embed =
    new EmbedBuilder()
      .setTitle('📜 EDITAL DE RECRUTAMENTO')
      .setDescription(
        `Olá <@${member.id}>!\n\n` +
        'Seu edital foi criado.\n\n' +
        'Clique em **Iniciar** para começar.\n\n' +
        '⚠️ Depois de iniciar, você deverá responder todas as perguntas dentro do tempo determinado.'
      )
      .setColor(0x111111);

  const row =
    new ActionRowBuilder().addComponents(

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

  await channel.send({
    content: `<@${member.id}>`,
    embeds: [embed],
    components: [row]
  });

  await interaction.reply({
    content:
      `✅ Seu edital foi criado: ${channel}`,
    ephemeral: true
  });
}


async function finishEdital(
  channel,
  member,
  approved
) {
  if (approved) {

    const addedRoles = [];

    for (
      const roleId of CONFIG.approvedRoles
    ) {
      try {
        const role =
          channel.guild.roles.cache.get(
            roleId
          );

        if (role) {
          await member.roles.add(role);
          addedRoles.push(role.name);
        }
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
          .setTitle('✅ EDITAL APROVADO')
          .setDescription(
            `Parabéns ${member}!\n\n` +
            'Você foi aprovado no edital e recebeu os cargos da facção.'
          )
          .setColor(0x2ecc71)
      ]
    });

    await sendLog(
      channel.guild,
      `📜 **EDITAL APROVADO**\nMembro: ${member}\nCargos: ${addedRoles.join(', ') || 'Nenhum'}`
    );

  } else {

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ EDITAL REPROVADO')
          .setDescription(
            `${member}\n\n` +
            'Você foi reprovado no edital.\n\n' +
            '📚 Estude mais e tente novamente futuramente.'
          )
          .setColor(0xe74c3c)
      ]
    });

    await sendLog(
      channel.guild,
      `❌ **EDITAL REPROVADO**\nMembro: ${member}`
    );
  }

  editaisAtivos.delete(member.id);

  closeEditalChannel(channel);
}


async function runEdital(interaction) {
  const channel =
    interaction.channel;

  const ownerMatch =
    channel.topic?.match(
      /editalOwner:(\d+)/
    );

  if (!ownerMatch) {
    return interaction.reply({
      content:
        '❌ Este canal não é um edital válido.',
      ephemeral: true
    });
  }

  const ownerId =
    ownerMatch[1];

  if (
    interaction.user.id !== ownerId
  ) {
    return interaction.reply({
      content:
        '❌ Apenas o candidato pode iniciar este edital.',
      ephemeral: true
    });
  }

  if (editaisAtivos.has(ownerId)) {
    return interaction.reply({
      content:
        '❌ Este edital já foi iniciado.',
      ephemeral: true
    });
  }

  const member =
    await interaction.guild.members.fetch(
      ownerId
    );

  editaisAtivos.set(
    ownerId,
    {
      started: Date.now()
    }
  );

  await interaction.reply({
    content:
      '▶️ **Edital iniciado!** Prepare-se.',
    ephemeral: true
  });

  let approved = true;

  for (
    let i = 0;
    i < editalQuestions.length;
    i++
  ) {

    const question =
      editalQuestions[i];

    const start =
      Date.now();

    const startText =
      new Date(start).toLocaleTimeString(
        'pt-BR'
      );

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            `📋 Pergunta ${i + 1}/${editalQuestions.length}`
          )
          .setDescription(
            `${question.text}\n\n` +
            `⏱️ **Início:** ${startText}\n` +
            `⏳ **Tempo:** ${question.time} minuto(s)`
          )
          .setColor(0x3498db)
      ]
    });

    let collected;

    try {

      collected =
        await channel.awaitMessages({
          filter: message =>
            message.author.id === ownerId,

          max: 1,

          time:
            question.time *
            60 *
            1000,

          errors: ['time']
        });

    } catch {

      approved = false;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('⏰ TEMPO ESGOTADO')
            .setDescription(
              `${member}\n\n` +
              `Você não respondeu a pergunta ${i + 1} dentro do tempo permitido.`
            )
            .setColor(0xe74c3c)
        ]
      });

      break;
    }

    const answer =
      collected.first();

    const end =
      Date.now();

    const endText =
      new Date(end).toLocaleTimeString(
        'pt-BR'
      );

    await channel.send({
      content:
        `✅ Resposta registrada.\n` +
        `🕐 **Início:** ${startText}\n` +
        `🕐 **Fim:** ${endText}`
    });

    if (question.answer) {

      const userAnswer =
        answer.content
          .trim()
          .toUpperCase()
          .replace(/[^A-D]/g, '');

      if (
        userAnswer !== question.answer
      ) {

        approved = false;

        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ RESPOSTA INCORRETA')
              .setDescription(
                `A pergunta ${i + 1} foi respondida incorretamente.`
              )
              .setColor(0xe74c3c)
          ]
        });

        break;
      }
    }
  }

  await finishEdital(
    channel,
    member,
    approved
  );
}


/* =========================================================
   REGISTRAR
========================================================= */

function registrarEmbed() {
  return new EmbedBuilder()
    .setTitle('📝 REGISTRO')
    .setDescription(
      'Clique no botão abaixo para realizar seu registro.\n\n' +
      'Informe seu **Nick** e seu **ID** corretamente.'
    )
    .setColor(0x111111)
    .setImage(CONFIG.registrarImage)
    .setFooter({
      text: 'Pavuna • Registro'
    });
}


function registrarRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_registro')
      .setLabel('Registrar')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Success)
  );
}


async function abrirModalRegistro(
  interaction
) {
  const modal =
    new ModalBuilder()
      .setCustomId('modal_registro')
      .setTitle('📝 Registro');

  const nick =
    new TextInputBuilder()
      .setCustomId('registro_nick')
      .setLabel('Nick')
      .setPlaceholder('Digite seu nick')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(30);

  const id =
    new TextInputBuilder()
      .setCustomId('registro_id')
      .setLabel('ID')
      .setPlaceholder('Digite seu ID')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(15);

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      nick
    ),
    new ActionRowBuilder().addComponents(
      id
    )
  );

  return interaction.showModal(modal);
}


async function realizarRegistro(
  interaction
) {
  const nick =
    interaction.fields
      .getTextInputValue(
        'registro_nick'
      )
      .trim();

  const id =
    interaction.fields
      .getTextInputValue(
        'registro_id'
      )
      .trim();

  if (!/^\d+$/.test(id)) {
    return interaction.reply({
      content:
        '❌ O ID precisa conter apenas números.',
      ephemeral: true
    });
  }

  const novoNick =
    `⋆ 𝓟𝓥𝓝 ⋆ ${nick} ⋆${id}`;

  try {

    await interaction.member.setNickname(
      novoNick
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ REGISTRO REALIZADO')
          .setDescription(
            `Seu registro foi realizado com sucesso!\n\n` +
            `👤 **Nick:** ${nick}\n` +
            `🆔 **ID:** ${id}\n\n` +
            `🏷️ **Novo nome:** ${novoNick}`
          )
          .setColor(0x2ecc71)
      ],
      ephemeral: true
    });

    await sendLog(
      interaction.guild,
      `📝 **REGISTRO**\nMembro: ${interaction.user}\nNick: ${nick}\nID: ${id}`
    );

  } catch (error) {

    console.error(error);

    await interaction.reply({
      content:
        '❌ Não consegui alterar seu apelido. Verifique se o bot possui **Gerenciar Apelidos** e se o cargo do bot está acima do seu cargo.',
      ephemeral: true
    });
  }
}


/* =========================================================
   BATE-PONTO
========================================================= */

function membroEstaEmCallPermitida(
  member
) {
  return Boolean(
    member.voice.channelId &&
    CONFIG.pontoVoiceChannels.includes(
      member.voice.channelId
    )
  );
}


function pontoPainelEmbed() {
  return new EmbedBuilder()
    .setTitle('🕐 BATE-PONTO')
    .setDescription(
      'Olá! Seja bem-vindo ao **Bate-Ponto**.\n\n' +
      'Aqui você registra seus horários para subir na facção.\n\n' +
      '⏱️ É necessário cumprir pelo menos **7 horas semanais**.\n\n' +
      '⚠️ Caso não cumpra a meta semanal, poderá receber uma punição conforme as regras da facção.'
    )
    .setColor(0x111111)
    .setFooter({
      text: 'Pavuna • Bate-Ponto'
    });
}


function pontoPainelRow() {
  return new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId('ponto_comecar')
      .setLabel('COMEÇAR')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('ponto_fechar')
      .setLabel('FECHAR')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('ponto_ranking')
      .setLabel('RANKING')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary)
  );
}


async function iniciarPonto(
  interaction
) {
  const member =
    interaction.member;

  if (pontosAtivos.has(member.id)) {
    return interaction.reply({
      content:
        '❌ Você já possui um ponto aberto.',
      ephemeral: true
    });
  }

  if (
    !membroEstaEmCallPermitida(member)
  ) {
    return interaction.reply({
      content:
        '❌ Você precisa estar em um dos canais de voz autorizados para iniciar o ponto.',
      ephemeral: true
    });
  }

  garantirMembroPonto(member.id);

  pontosAtivos.set(
    member.id,
    {
      inicio: Date.now(),
      channelId:
        member.voice.channelId
    }
  );

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('▶️ PONTO INICIADO')
        .setDescription(
          `Seu ponto foi iniciado com sucesso.\n\n` +
          `🎙️ Canal: <#${member.voice.channelId}>\n` +
          `🕐 Início: ${new Date().toLocaleTimeString('pt-BR')}`
        )
        .setColor(0x2ecc71)
    ],
    ephemeral: true
  });
}


async function fecharPonto(
  interaction
) {
  const member =
    interaction.member;

  const ativo =
    pontosAtivos.get(member.id);

  if (!ativo) {
    return interaction.reply({
      content:
        '❌ Você não possui um ponto aberto.',
      ephemeral: true
    });
  }

  const agora =
    Date.now();

  const tempo =
    agora - ativo.inicio;

  const registro =
    garantirMembroPonto(member.id);

  registro.semanal += tempo;
  registro.total += tempo;

  pontosAtivos.delete(
    member.id
  );

  salvarPontos();

  const meta =
    registro.semanal >=
    CONFIG.pontoMetaSemanalMs;

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('⏹️ PONTO ENCERRADO')
        .setDescription(
          `⏱️ **Tempo desta jornada:** ${formatarTempo(tempo)}\n\n` +
          `📅 **Tempo semanal:** ${formatarTempo(registro.semanal)}\n\n` +
          `📊 **Tempo total:** ${formatarTempo(registro.total)}\n\n` +
          `${meta ? '✅ **Meta semanal de 7 horas atingida!**' : '⚠️ **Meta semanal de 7 horas ainda não atingida.**'}`
        )
        .setColor(
          meta
            ? 0x2ecc71
            : 0xe67e22
        )
    ],
    ephemeral: true
  });
}


async function mostrarRanking(
  interaction
) {
  if (
    !membroTemAdmin(
      interaction.member
    )
  ) {
    return interaction.reply({
      content:
        '❌ Você não possui permissão para visualizar o ranking.',
      ephemeral: true
    });
  }

  const semana =
    getSemanaAtual();

  const ranking =
    Object.entries(pontos)
      .map(
        ([userId, data]) => {

          const semanal =
            data.semana === semana
              ? data.semanal
              : 0;

          let atual =
            semanal;

          const ativo =
            pontosAtivos.get(
              userId
            );

          if (ativo) {
            atual +=
              Date.now() -
              ativo.inicio;
          }

          return {
            userId,
            semanal: atual,
            total:
              data.total +
              (
                ativo
                  ? Date.now() -
                    ativo.inicio
                  : 0
              )
          };
        }
      )
      .sort(
        (a, b) =>
          b.semanal -
          a.semanal
      )
      .slice(0, 20);

  if (!ranking.length) {
    return interaction.reply({
      content:
        '📊 Ainda não existem registros no ranking.',
      ephemeral: true
    });
  }

  let descricao = '';

  for (
    let i = 0;
    i < ranking.length;
    i++
  ) {
    const item =
      ranking[i];

    descricao +=
      `**${i + 1}.** <@${item.userId}> — ` +
      `${formatarTempo(item.semanal)} semanal\n`;
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('🏆 RANKING DO BATE-PONTO')
        .setDescription(
          `📅 Semana: **${semana}**\n\n${descricao}`
        )
        .setColor(0xf1c40f)
        .setFooter({
          text: 'Meta semanal: 7 horas'
        })
    ],
    ephemeral: true
  });
}


/* =========================================================
   TICKETS
========================================================= */

const TICKET_CATEGORIES = {

  encomendas: {
    label: 'Encomendas',
    emoji: '📦'
  },

  denuncias: {
    label: 'Denúncias',
    emoji: '🚨'
  },

  duvidas: {
    label: 'Dúvidas',
    emoji: '❓'
  },

  outros: {
    label: 'Outros Assuntos',
    emoji: '📌'
  }
};


function ticketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 CENTRAL DE ATENDIMENTO')
    .setDescription(
      'Selecione abaixo o tipo de atendimento que você precisa.\n\n' +
      '📦 **Encomendas**\n' +
      'Atendimento relacionado a encomendas.\n\n' +
      '🚨 **Denúncias**\n' +
      'Para realizar uma denúncia.\n\n' +
      '❓ **Dúvidas**\n' +
      'Para tirar suas dúvidas.\n\n' +
      '📌 **Outros Assuntos**\n' +
      'Para outros assuntos que não se encaixam nas opções acima.\n\n' +
      '⚠️ Selecione a opção correta para agilizar seu atendimento.'
    )
    .setColor(0x111111)
    .setImage(CONFIG.ticketImage)
    .setFooter({
      text: 'Pavuna • Central de Atendimento'
    });
}


function ticketPanelRow() {
  return new ActionRowBuilder().addComponents(

    new StringSelectMenuBuilder()
      .setCustomId('ticket_categoria')
      .setPlaceholder(
        '🎫 Selecione uma categoria'
      )
      .addOptions(

        new StringSelectMenuOptionBuilder()
          .setLabel('Encomendas')
          .setDescription(
            'Atendimento sobre encomendas'
          )
          .setEmoji('📦')
          .setValue('encomendas'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Denúncias')
          .setDescription(
            'Realizar uma denúncia'
          )
          .setEmoji('🚨')
          .setValue('denuncias'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Dúvidas')
          .setDescription(
            'Tirar uma dúvida'
          )
          .setEmoji('❓')
          .setValue('duvidas'),

        new StringSelectMenuOptionBuilder()
          .setLabel('Outros Assuntos')
          .setDescription(
            'Outros assuntos'
          )
          .setEmoji('📌')
          .setValue('outros')
      )
  );
}


function ticketButtonsRow() {
  return new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId(
        'ticket_reivindicar'
      )
      .setLabel('Reivindicar')
      .setEmoji('🛡️')
      .setStyle(
        ButtonStyle.Primary
      ),

    new ButtonBuilder()
      .setCustomId(
        'ticket_fechar'
      )
      .setLabel('Fechar')
      .setEmoji('🔒')
      .setStyle(
        ButtonStyle.Danger
      )
  );
}


function ticketManageRow() {
  return new ActionRowBuilder().addComponents(

    new StringSelectMenuBuilder()
      .setCustomId(
        'ticket_gerenciar_player'
      )
      .setPlaceholder(
        '👥 Adicionar / Retirar player'
      )
      .addOptions(

        new StringSelectMenuOptionBuilder()
          .setLabel(
            'Adicionar um player'
          )
          .setDescription(
            'Adicionar outro player ao ticket'
          )
          .setEmoji('➕')
          .setValue('adicionar'),

        new StringSelectMenuOptionBuilder()
          .setLabel(
            'Retirar um player'
          )
          .setDescription(
            'Retirar um player do ticket'
          )
          .setEmoji('➖')
          .setValue('retirar')
      )
  );
}


function findPlayerTicket(
  guild,
  userId
) {
  return guild.channels.cache.find(
    channel =>
      channel.type ===
        ChannelType.GuildText &&
      channel.topic?.includes(
        `ticketOwner:${userId}`
      )
  );
}


async function createTicket(
  interaction,
  categoryKey
) {
  const guild =
    interaction.guild;

  const member =
    interaction.member;

  const category =
    TICKET_CATEGORIES[
      categoryKey
    ];

  if (!category) {
    return interaction.reply({
      content:
        '❌ Categoria inválida.',
      ephemeral: true
    });
  }

  const existing =
    findPlayerTicket(
      guild,
      member.id
    );

  if (existing) {
    return interaction.reply({
      content:
        `❌ Você já possui um ticket aberto: ${existing}`,
      ephemeral: true
    });
  }

  const playerName =
    ticketSafeName(
      member.displayName ||
      member.user.username
    );

  const categoryName =
    ticketSafeName(
      category.label
    );

  const channelName =
    `${playerName}-${categoryName}`
      .slice(0, 100);

  const permissionOverwrites = [

    {
      id:
        guild.roles.everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    {
      id:
        member.id,

      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },

    ...CONFIG.ticketStaffRoles.map(
      roleId => ({
        id: roleId,

        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      })
    )
  ];

  const channelOptions = {

    name:
      channelName,

    type:
      ChannelType.GuildText,

    topic:
      `ticketOwner:${member.id}|category:${categoryKey}|claimedBy:none`,

    permissionOverwrites
  };

  if (
    CONFIG.ticketCategoryId
  ) {
    channelOptions.parent =
      CONFIG.ticketCategoryId;
  }

  const channel =
    await guild.channels.create(
      channelOptions
    );

  const embed =
    new EmbedBuilder()
      .setTitle(
        `${category.emoji} ${category.label}`
      )
      .setDescription(
        `Olá <@${member.id}>!\n\n` +
        `${category.emoji} **${category.label}**\n\n` +
        'Espere um **Superior** te atender.\n\n' +
        '📝 **Explique mais algumas coisas sobre o seu atendimento.**'
      )
      .setColor(0x111111)
      .setFooter({
        text:
          'Pavuna • Atendimento'
      });

  await channel.send({
    content:
      `<@${member.id}>`,
    embeds: [
      embed
    ],
    components: [
      ticketButtonsRow(),
      ticketManageRow()
    ]
  });

  await sendLog(
    guild,
    `🎫 **TICKET ABERTO**\nMembro: ${member}\nCategoria: ${category.label}\nCanal: ${channel}`
  );

  return interaction.reply({
    content:
      `✅ Seu ticket foi criado com sucesso: ${channel}`,
    ephemeral: true
  });
}


async function claimTicket(
  interaction
) {
  if (
    !membroTemTicketStaff(
      interaction.member
    )
  ) {
    return interaction.reply({
      content:
        '❌ Apenas os cargos autorizados podem reivindicar tickets.',
      ephemeral: true
    });
  }

  const channel =
    interaction.channel;

  if (
    !channel.topic?.includes(
      'ticketOwner:'
    )
  ) {
    return interaction.reply({
      content:
        '❌ Este canal não é um ticket.',
      ephemeral: true
    });
  }

  const match =
    channel.topic.match(
      /claimedBy:([^|]+)/
    );

  const claimedBy =
    match?.[1] || 'none';

  if (
    claimedBy !== 'none'
  ) {
    return interaction.reply({
      content:
        `❌ Este ticket já foi reivindicado por <@${claimedBy}>.`,
      ephemeral: true
    });
  }

  await channel.setTopic(
    channel.topic.replace(
      'claimedBy:none',
      `claimedBy:${interaction.user.id}`
    )
  );

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(
          '🛡️ Ticket reivindicado'
        )
        .setDescription(
          `${interaction.user} assumiu este atendimento.`
        )
        .setColor(0x3498db)
    ]
  });
}


async function closeTicket(
  interaction
) {
  const channel =
    interaction.channel;

  if (
    !channel.topic?.includes(
      'ticketOwner:'
    )
  ) {
    return interaction.reply({
      content:
        '❌ Este canal não é um ticket.',
      ephemeral: true
    });
  }

  const ownerMatch =
    channel.topic.match(
      /ticketOwner:(\d+)/
    );

  const ownerId =
    ownerMatch?.[1];

  if (
    interaction.user.id !== ownerId &&
    !membroTemTicketStaff(
      interaction.member
    )
  ) {
    return interaction.reply({
      content:
        '❌ Apenas o dono do ticket ou um Superior pode fechá-lo.',
      ephemeral: true
    });
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(
          '🔒 Ticket fechado'
        )
        .setDescription(
          'Este ticket será excluído em **5 segundos**.'
        )
        .setColor(0xe74c3c)
    ]
  });

  await sendLog(
    interaction.guild,
    `🔒 **TICKET FECHADO**\nCanal: #${channel.name}\nFechado por: ${interaction.user}`
  );

  setTimeout(
    async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error(
          'Erro ao excluir ticket:',
          error
        );
      }
    },
    CONFIG.closeAfterMs
  );
}


async function openTicketPlayerModal(
  interaction,
  action
) {
  if (
    !membroTemTicketStaff(
      interaction.member
    )
  ) {
    return interaction.reply({
      content:
        '❌ Apenas os cargos autorizados podem gerenciar players.',
      ephemeral: true
    });
  }

  const modal =
    new ModalBuilder()
      .setCustomId(
        `ticket_player_${action}`
      )
      .setTitle(
        action === 'adicionar'
          ? '➕ Adicionar Player'
          : '➖ Retirar Player'
      );

  const input =
    new TextInputBuilder()
      .setCustomId(
        'player_id'
      )
      .setLabel(
        'ID do Player'
      )
      .setPlaceholder(
        'Digite o ID do Discord'
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setRequired(true)
      .setMaxLength(25);

  modal.addComponents(
    new ActionRowBuilder()
      .addComponents(
        input
      )
  );

  return interaction.showModal(
    modal
  );
}


async function manageTicketPlayer(
  interaction,
  action
) {
  if (
    !membroTemTicketStaff(
      interaction.member
    )
  ) {
    return interaction.reply({
      content:
        '❌ Apenas os cargos autorizados podem gerenciar players.',
      ephemeral: true
    });
  }

  const playerId =
    interaction.fields
      .getTextInputValue(
        'player_id'
      )
      .trim();

  if (
    !/^\d+$/.test(
      playerId
    )
  ) {
    return interaction.reply({
      content:
        '❌ O ID informado é inválido.',
      ephemeral: true
    });
  }

  const channel =
    interaction.channel;

  const ownerMatch =
    channel.topic?.match(
      /ticketOwner:(\d+)/
    );

  if (!ownerMatch) {
    return interaction.reply({
      content:
        '❌ Este canal não é um ticket.',
      ephemeral: true
    });
  }

  if (
    action === 'retirar' &&
    playerId === ownerMatch[1]
  ) {
    return interaction.reply({
      content:
        '❌ O dono original do ticket não pode ser retirado.',
      ephemeral: true
    });
  }

  try {

    const player =
      await interaction.guild.members.fetch(
        playerId
      );

    if (
      action === 'adicionar'
    ) {

      await channel.permissionOverwrites.edit(
        player.id,
        {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        }
      );

      await channel.send({
        content:
          `➕ ${player} foi adicionado ao ticket por ${interaction.user}.`
      });

      return interaction.reply({
        content:
          `✅ ${player} foi adicionado ao ticket.`,
        ephemeral: true
      });
    }

    await channel.permissionOverwrites.delete(
      player.id
    );

    await channel.send({
      content:
        `➖ ${player} foi retirado do ticket por ${interaction.user}.`
    });

    return interaction.reply({
      content:
        `✅ ${player} foi retirado do ticket.`,
      ephemeral: true
    });

  } catch (error) {

    console.error(
      error
    );

    return interaction.reply({
      content:
        '❌ Não encontrei esse player no servidor. Verifique o ID.',
      ephemeral: true
    });
  }
}


/* =========================================================
   CLIENT
========================================================= */

const client =
  new Client({

    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ],

    partials: [
      Partials.Channel
    ]
  });


/* =========================================================
   COMANDOS
========================================================= */

const commands = [

  new SlashCommandBuilder()
    .setName('painel')
    .setDescription(
      'Abrir um painel da Pavuna'
    )

    .addSubcommand(
      sub =>
        sub
          .setName('edital')
          .setDescription(
            'Abrir o painel de edital'
          )
    )

    .addSubcommand(
      sub =>
        sub
          .setName('registrar')
          .setDescription(
            'Abrir o painel de registro'
          )
    )

    .addSubcommand(
      sub =>
        sub
          .setName('ponto')
          .setDescription(
            'Abrir o painel de bate-ponto'
          )
    )

    .addSubcommand(
      sub =>
        sub
          .setName('ticket')
          .setDescription(
            'Abrir o painel de tickets'
          )
    )

    .addSubcommand(
      sub =>
        sub
          .setName('promocao')
          .setDescription(
            'Promover um membro'
          )
          .addUserOption(
            option =>
              option
                .setName('membro')
                .setDescription(
                  'Membro'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('cargo_antigo')
                .setDescription(
                  'ID do cargo antigo'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('novo_cargo')
                .setDescription(
                  'ID do novo cargo'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('motivo')
                .setDescription(
                  'Motivo da promoção'
                )
                .setRequired(true)
          )
    )

    .addSubcommand(
      sub =>
        sub
          .setName('rebaixamento')
          .setDescription(
            'Rebaixar um membro'
          )
          .addUserOption(
            option =>
              option
                .setName('membro')
                .setDescription(
                  'Membro'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('cargo_antigo')
                .setDescription(
                  'ID do cargo antigo'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('novo_cargo')
                .setDescription(
                  'ID do novo cargo'
                )
                .setRequired(true)
          )
          .addStringOption(
            option =>
              option
                .setName('motivo')
                .setDescription(
                  'Motivo do rebaixamento'
                )
                .setRequired(true)
          )
    ),

  new SlashCommandBuilder()
    .setName('exoneracao')
    .setDescription(
      'Exonerar um membro'
    )
    .addStringOption(
      option =>
        option
          .setName('motivo')
          .setDescription(
            'Motivo da exoneração'
          )
          .setRequired(true)
    )
    .addUserOption(
      option =>
        option
          .setName('membro')
          .setDescription(
            'Membro'
          )
          .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription(
      'Banir ou desbanir um membro'
    )
    .addUserOption(
      option =>
        option
          .setName('membro')
          .setDescription(
            'Membro'
          )
          .setRequired(true)
    )
].map(
  command =>
    command.toJSON()
);


/* =========================================================
   READY
========================================================= */

client.once(
  'ready',
  async () => {

    console.log(
      `✅ Bot conectado como ${client.user.tag}`
    );

    const rest =
      new REST({
        version: '10'
      }).setToken(
        process.env.TOKEN
      );

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

    } catch (error) {

      console.error(
        'Erro ao registrar comandos:',
        error
      );
    }
  }
);


/* =========================================================
   INTERAÇÕES
========================================================= */

client.on(
  'interactionCreate',
  async interaction => {

    try {

      /* =====================================================
         SLASH COMMANDS
      ===================================================== */

      if (
        interaction.isChatInputCommand()
      ) {

        /* ================================================
           /PAINEL
        ================================================ */

        if (
          interaction.commandName ===
          'painel'
        ) {

          if (
            !membroTemAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                '❌ Você não possui permissão para utilizar este painel.',
              ephemeral: true
            });
          }

          const subcommand =
            interaction.options.getSubcommand();

          /* EDITAL */

          if (
            subcommand ===
            'edital'
          ) {

            return interaction.reply({
              embeds: [
                editalPanelEmbed()
              ],
              components: [
                editalPanelRow()
              ]
            });
          }

          /* REGISTRAR */

          if (
            subcommand ===
            'registrar'
          ) {

            return interaction.reply({
              embeds: [
                registrarEmbed()
              ],
              components: [
                registrarRow()
              ]
            });
          }

          /* PONTO */

          if (
            subcommand ===
            'ponto'
          ) {

            return interaction.reply({
              embeds: [
                pontoPainelEmbed()
              ],
              components: [
                pontoPainelRow()
              ]
            });
          }

          /* TICKET */

          if (
            subcommand ===
            'ticket'
          ) {

            return interaction.reply({
              embeds: [
                ticketPanelEmbed()
              ],
              components: [
                ticketPanelRow()
              ]
            });
          }

          /* PROMOÇÃO */

          if (
            subcommand ===
            'promocao'
          ) {

            const membro =
              interaction.options.getMember(
                'membro'
              );

            const cargoAntigo =
              interaction.options.getString(
                'cargo_antigo'
              );

            const novoCargo =
              interaction.options.getString(
                'novo_cargo'
              );

            const motivo =
              interaction.options.getString(
                'motivo'
              );

            if (!membro) {
              return interaction.reply({
                content:
                  '❌ Membro não encontrado.',
                ephemeral: true
              });
            }

            const oldRole =
              interaction.guild.roles.cache.get(
                cargoAntigo
              );

            const newRole =
              interaction.guild.roles.cache.get(
                novoCargo
              );

            if (!newRole) {
              return interaction.reply({
                content:
                  '❌ O novo cargo não foi encontrado. Informe o ID correto.',
                ephemeral: true
              });
            }

            try {

              if (
                oldRole &&
                membro.roles.cache.has(
                  oldRole.id
                )
              ) {
                await membro.roles.remove(
                  oldRole
                );
              }

              await membro.roles.add(
                newRole
              );

              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      '⬆️ PROMOÇÃO REALIZADA'
                    )
                    .setDescription(
                      `👤 **Membro:** ${membro}\n\n` +
                      `📌 **Cargo antigo:** ${oldRole ? oldRole.name : cargoAntigo}\n` +
                      `🏅 **Novo cargo:** ${newRole.name}\n\n` +
                      `📝 **Motivo:** ${motivo}\n\n` +
                      `👮 **Responsável:** ${interaction.user}`
                    )
                    .setColor(0x2ecc71)
                ]
              });

              await sendLog(
                interaction.guild,
                `⬆️ **PROMOÇÃO**\nMembro: ${membro}\nNovo cargo: ${newRole.name}\nMotivo: ${motivo}\nResponsável: ${interaction.user}`
              );

            } catch (error) {

              console.error(
                error
              );

              return interaction.reply({
                content:
                  '❌ Não consegui alterar os cargos. Verifique a hierarquia do bot.',
                ephemeral: true
              });
            }

            return;
          }

          /* REBAIXAMENTO */

          if (
            subcommand ===
            'rebaixamento'
          ) {

            const membro =
              interaction.options.getMember(
                'membro'
              );

            const cargoAntigo =
              interaction.options.getString(
                'cargo_antigo'
              );

            const novoCargo =
              interaction.options.getString(
                'novo_cargo'
              );

            const motivo =
              interaction.options.getString(
                'motivo'
              );

            if (!membro) {
              return interaction.reply({
                content:
                  '❌ Membro não encontrado.',
                ephemeral: true
              });
            }

            const oldRole =
              interaction.guild.roles.cache.get(
                cargoAntigo
              );

            const newRole =
              interaction.guild.roles.cache.get(
                novoCargo
              );

            if (!newRole) {
              return interaction.reply({
                content:
                  '❌ O novo cargo não foi encontrado. Informe o ID correto.',
                ephemeral: true
              });
            }

            try {

              if (
                oldRole &&
                membro.roles.cache.has(
                  oldRole.id
                )
              ) {
                await membro.roles.remove(
                  oldRole
                );
              }

              await membro.roles.add(
                newRole
              );

              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      '⬇️ REBAIXAMENTO REALIZADO'
                    )
                    .setDescription(
                      `👤 **Membro:** ${membro}\n\n` +
                      `📌 **Cargo antigo:** ${oldRole ? oldRole.name : cargoAntigo}\n` +
                      `🏅 **Novo cargo:** ${newRole.name}\n\n` +
                      `📝 **Motivo:** ${motivo}\n\n` +
                      `👮 **Responsável:** ${interaction.user}`
                    )
                    .setColor(0xe67e22)
                ]
              });

              await sendLog(
                interaction.guild,
                `⬇️ **REBAIXAMENTO**\nMembro: ${membro}\nNovo cargo: ${newRole.name}\nMotivo: ${motivo}\nResponsável: ${interaction.user}`
              );

            } catch (error) {

              console.error(
                error
              );

              return interaction.reply({
                content:
                  '❌ Não consegui alterar os cargos. Verifique a hierarquia do bot.',
                ephemeral: true
              });
            }

            return;
          }
        }


        /* =================================================
           /EXONERACAO
        ================================================= */

        if (
          interaction.commandName ===
          'exoneracao'
        ) {

          if (
            !membroTemAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                '❌ Você não possui permissão para exonerar membros.',
              ephemeral: true
            });
          }

          const membro =
            interaction.options.getMember(
              'membro'
            );

          const motivo =
            interaction.options.getString(
              'motivo'
            );

          if (!membro) {
            return interaction.reply({
              content:
                '❌ Membro não encontrado.',
              ephemeral: true
            });
          }

          if (
            membro.id ===
            interaction.guild.ownerId
          ) {
            return interaction.reply({
              content:
                '❌ O dono do servidor não pode ser exonerado.',
              ephemeral: true
            });
          }

          try {

            const rolesToRemove =
              membro.roles.cache.filter(
                role =>
                  role.id !==
                    interaction.guild.id &&
                  !CONFIG.exoneracaoKeepRoles.includes(
                    role.id
                  )
              );

            for (
              const role of rolesToRemove.values()
            ) {

              try {
                await membro.roles.remove(
                  role
                );
              } catch {}
            }

            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    '❌ EXONERAÇÃO REALIZADA'
                  )
                  .setDescription(
                    `👤 **Membro:** ${membro}\n\n` +
                    `📝 **Motivo:** ${motivo}\n\n` +
                    `👮 **Responsável:** ${interaction.user}`
                  )
                  .setColor(0xe74c3c)
              ]
            });

            await sendLog(
              interaction.guild,
              `❌ **EXONERAÇÃO**\nMembro: ${membro}\nMotivo: ${motivo}\nResponsável: ${interaction.user}`
            );

          } catch (error) {

            console.error(
              error
            );

            return interaction.reply({
              content:
                '❌ Não consegui remover os cargos. Verifique a hierarquia do bot.',
              ephemeral: true
            });
          }

          return;
        }


        /* =================================================
           /BLACKLIST
        ================================================= */

        if (
          interaction.commandName ===
          'blacklist'
        ) {

          if (
            !membroTemAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                '❌ Você não possui permissão para usar a blacklist.',
              ephemeral: true
            });
          }

          const user =
            interaction.options.getUser(
              'membro'
            );

          if (!user) {
            return interaction.reply({
              content:
                '❌ Membro não encontrado.',
              ephemeral: true
            });
          }

          try {

            const ban =
              await interaction.guild.bans.fetch(
                user.id
              ).catch(
                () => null
              );

            if (ban) {

              await interaction.guild.members.unban(
                user.id
              );

              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      '✅ BLACKLIST REMOVIDA'
                    )
                    .setDescription(
                      `👤 **Usuário:** ${user}\n\n` +
                      `👮 **Responsável:** ${interaction.user}`
                    )
                    .setColor(0x2ecc71)
                ]
              });

              await sendLog(
                interaction.guild,
                `✅ **BLACKLIST REMOVIDA**\nUsuário: ${user.tag}\nResponsável: ${interaction.user}`
              );

            } else {

              await interaction.guild.members.ban(
                user.id,
                {
                  reason:
                    `Blacklist por ${interaction.user.tag}`
                }
              );

              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      '🚫 USUÁRIO ADICIONADO À BLACKLIST'
                    )
                    .setDescription(
                      `👤 **Usuário:** ${user}\n\n` +
                      `👮 **Responsável:** ${interaction.user}`
                    )
                    .setColor(0xe74c3c)
                ]
              });

              await sendLog(
                interaction.guild,
                `🚫 **BLACKLIST**\nUsuário: ${user.tag}\nResponsável: ${interaction.user}`
              );
            }

          } catch (error) {

            console.error(
              error
            );

            return interaction.reply({
              content:
                '❌ Não consegui alterar a blacklist. Verifique se o bot possui permissão para banir membros.',
              ephemeral: true
            });
          }

          return;
        }
      }


      /* =====================================================
         BOTÃO - ABRIR EDITAL
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'abrir_edital'
      ) {

        return createEditalChannel(
          interaction
        );
      }


      /* =====================================================
         BOTÃO - INICIAR EDITAL
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'iniciar_edital'
      ) {

        return runEdital(
          interaction
        );
      }


      /* =====================================================
         BOTÃO - FECHAR EDITAL
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'fechar_edital'
      ) {

        const ownerMatch =
          interaction.channel.topic?.match(
            /editalOwner:(\d+)/
          );

        if (
          !ownerMatch
        ) {
          return interaction.reply({
            content:
              '❌ Este canal não é um edital.',
            ephemeral: true
          });
        }

        if (
          interaction.user.id !==
            ownerMatch[1] &&
          !membroTemAdmin(
            interaction.member
          )
        ) {
          return interaction.reply({
            content:
              '❌ Você não pode fechar este edital.',
            ephemeral: true
          });
        }

        await interaction.reply({
          content:
            '🔒 Edital fechado. O canal será excluído em 5 segundos.'
        });

        editaisAtivos.delete(
          ownerMatch[1]
        );

        closeEditalChannel(
          interaction.channel
        );

        return;
      }


      /* =====================================================
         BOTÃO - REGISTRO
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'abrir_registro'
      ) {

        return abrirModalRegistro(
          interaction
        );
      }


      /* =====================================================
         MODAL - REGISTRO
      ===================================================== */

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          'modal_registro'
      ) {

        return realizarRegistro(
          interaction
        );
      }


      /* =====================================================
         BOTÃO - PONTO
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'ponto_comecar'
      ) {

        return iniciarPonto(
          interaction
        );
      }


      if (
        interaction.isButton() &&
        interaction.customId ===
          'ponto_fechar'
      ) {

        return fecharPonto(
          interaction
        );
      }


      if (
        interaction.isButton() &&
        interaction.customId ===
          'ponto_ranking'
      ) {

        return mostrarRanking(
          interaction
        );
      }


      /* =====================================================
         SELECT - CATEGORIA DO TICKET
      ===================================================== */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          'ticket_categoria'
      ) {

        const category =
          interaction.values[0];

        return createTicket(
          interaction,
          category
        );
      }


      /* =====================================================
         BOTÃO - REIVINDICAR TICKET
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'ticket_reivindicar'
      ) {

        return claimTicket(
          interaction
        );
      }


      /* =====================================================
         BOTÃO - FECHAR TICKET
      ===================================================== */

      if (
        interaction.isButton() &&
        interaction.customId ===
          'ticket_fechar'
      ) {

        return closeTicket(
          interaction
        );
      }


      /* =====================================================
         SELECT - GERENCIAR PLAYER
      ===================================================== */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          'ticket_gerenciar_player'
      ) {

        const action =
          interaction.values[0];

        return openTicketPlayerModal(
          interaction,
          action
        );
      }


      /* =====================================================
         MODAL - ADICIONAR PLAYER
      ===================================================== */

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          'ticket_player_adicionar'
      ) {

        return manageTicketPlayer(
          interaction,
          'adicionar'
        );
      }


      /* =====================================================
         MODAL - RETIRAR PLAYER
      ===================================================== */

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          'ticket_player_retirar'
      ) {

        return manageTicketPlayer(
          interaction,
          'retirar'
        );
      }

    } catch (error) {

      console.error(
        'Erro na interação:',
        error
      );

      try {

        if (
          interaction.replied ||
          interaction.deferred
        ) {

          await interaction.followUp({
            content:
              '❌ Ocorreu um erro ao executar esta ação.',
            ephemeral: true
          });

        } else {

          await interaction.reply({
            content:
              '❌ Ocorreu um erro ao executar esta ação.',
            ephemeral: true
          });
        }

      } catch {}
    }
  }
);


/* =========================================================
   BATE-PONTO AUTOMÁTICO
========================================================= */

client.on(
  'voiceStateUpdate',
  async (
    oldState,
    newState
  ) => {

    const userId =
      newState.id ||
      oldState.id;

    const ativo =
      pontosAtivos.get(
        userId
      );

    if (!ativo) {
      return;
    }

    const novoCanal =
      newState.channelId;

    if (
      !novoCanal ||
      !CONFIG.pontoVoiceChannels.includes(
        novoCanal
      )
    ) {

      const tempo =
        Date.now() -
        ativo.inicio;

      const registro =
        garantirMembroPonto(
          userId
        );

      registro.semanal +=
        tempo;

      registro.total +=
        tempo;

      pontosAtivos.delete(
        userId
      );

      salvarPontos();

      try {

        const guild =
          newState.guild ||
          oldState.guild;

        const member =
          await guild.members.fetch(
            userId
          );

        await member.send(
          `⏹️ Seu bate-ponto foi encerrado automaticamente porque você saiu do canal autorizado.\n\n` +
          `⏱️ Tempo registrado: ${formatarTempo(tempo)}\n` +
          `📅 Tempo semanal: ${formatarTempo(registro.semanal)}`
        ).catch(
          () => {}
        );

      } catch {}
    }
  }
);


/* =========================================================
   LOGIN
========================================================= */

if (!process.env.TOKEN) {

  console.error(
    '❌ A variável TOKEN não foi encontrada.'
  );

  process.exit(1);
}

client.login(
  process.env.TOKEN
);
