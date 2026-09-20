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

require('dotenv').config();

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const CONFIG = {

  /* =======================================================
     IMAGENS
  ======================================================= */

  editalImage:
    'https://media.discordapp.net/attachments/1550653825659183144/1550714361973051474/Captura_de_tela_2026-09-19_004348.png?ex=6aaf56ca&is=6aae054a&hm=fd4f3deb9bbe0a581417d2504740aecfd43e72995527cc5bfb8804ec21f06eec&=&format=webp&quality=lossless',
  ticketImage:
    'https://media.discordapp.net/attachments/1551129943394492526/1551271126146093157/image.png?ex=6ab15d51&is=6ab00bd1&hm=dfb73fb6da0e56285dd3794dbefb774983871379aee0d5439575bff275610549&=&format=webp&quality=lossless',

  /* =======================================================
     CARGOS DA EQUIPE DE TICKETS
  ======================================================= */

  ticketStaffRoles: [
    '1550615266030002188',
    '1550615266046644257',
    '1550615266046644259'
  ],

  ticketCategoryId:
    process.env.TICKET_CATEGORY_ID || null,

  ticketLogChannelId:
    process.env.TICKET_LOG_CHANNEL_ID || null,
  
  registrarImage:
    'https://media.discordapp.net/attachments/1494717315743350836/1550919367339024384/648a4579-c535-4be5-b1ce-796cc37e6378.png?ex=6ab015b7&is=6aaec437&hm=9f3aaca3870b2a7156ada9d41fabb1613431204ea54008448c2199eb68baa925&=&format=webp&quality=lossless&width=768&height=317',

  /* =======================================================
     CARGOS ADMINISTRATIVOS
     
     SOMENTE ESTES 3 PODEM USAR OS SISTEMAS ADMINISTRATIVOS
  ======================================================= */

  adminRoles: [
    '1550615266046644259',
    '1550615266046644258',
    '1550615266046644257'
  ],

  /* =======================================================
     CARGOS QUE PODEM VER/ACOMPANHAR O EDITAL
  ======================================================= */

  editalAccessRoles: [
    '1550615266030002192',
    '1550615266030002193'
  ],

  /* =======================================================
     CARGOS RECEBIDOS APÓS APROVAÇÃO
  ======================================================= */

  approvedRoles: [
    '1550615266004574308',
    '1550615265954373758',
    '1550678827603329044',
    '1550893217027989654'
  ],

  /* =======================================================
     CARGOS QUE NÃO SERÃO REMOVIDOS NA EXONERAÇÃO
  ======================================================= */

  exoneracaoKeepRoles: [
    '1550615265954373757',
    '1550615265954373756'
  ],

  /* =======================================================
     CALLS PERMITIDAS PARA BATE-PONTO
  ======================================================= */

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

  /* =======================================================
     META SEMANAL
  ======================================================= */

  pontoMetaSemanalMs:
    7 * 60 * 60 * 1000,

  /* =======================================================
     OUTROS
  ======================================================= */

  editalCategoryId:
    process.env.EDITAL_CATEGORY_ID || null,

  logChannelId:
    process.env.LOG_CHANNEL_ID || null,

  closeAfterMs: 5000
};


/* =========================================================
   ARQUIVO DO BATE-PONTO
========================================================= */

const pontoFile =
  path.join(__dirname, 'pontos.json');

let pontos = {};

function carregarPontos() {
  try {
    if (!fs.existsSync(pontoFile)) {
      pontos = {};
      return;
    }

    const conteudo =
      fs.readFileSync(
        pontoFile,
        'utf8'
      );

    pontos =
      conteudo.trim()
        ? JSON.parse(conteudo)
        : {};

  } catch (error) {

    console.error(
      '❌ Erro ao carregar pontos.json:',
      error
    );

    pontos = {};
  }
}

carregarPontos();


function salvarPontos() {
  try {

    const tempFile =
      `${pontoFile}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(
        pontos,
        null,
        2
      ),
      'utf8'
    );

    fs.renameSync(
      tempFile,
      pontoFile
    );

  } catch (error) {

    console.error(
      '❌ Erro ao salvar pontos.json:',
      error
    );
  }
}


/* =========================================================
   PONTOS ATIVOS
========================================================= */

const pontosAtivos =
  new Map();


/* =========================================================
   SESSÕES DE EDITAL
========================================================= */

const sessions =
  new Map();


/* =========================================================
   PERGUNTAS DO EDITAL
========================================================= */

const QUESTIONS = [

  {
    n: 1,
    text:
      'Qual é o seu nome completo?',
    minutes: 3
  },

  {
    n: 2,
    text:
      'Qual é o seu nick?',
    minutes: 3
  },

  {
    n: 3,
    text:
      'Qual é o seu ID?',
    minutes: 3
  },

  {
    n: 4,
    text:
      'Por que você quer entrar para nossa facção? Mínimo de 2 linhas.',
    minutes: 5
  },

  {
    n: 5,
    text:
      'Já participou de alguma fac/corp? Se sim, qual e quanto tempo ficou nela?',
    minutes: 5
  },

  {
    n: 6,
    text:
      'O que é RDM?',
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
    text:
      'O que é VDM?',
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
    text:
      'O que é CL?',
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
    text:
      'O que é MG?',
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
    text:
      'O que é PG?',
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
    text:
      'O que você pode agregar para a nossa facção?',
    minutes: 5
  }

];


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
   UTILITÁRIOS
========================================================= */

function hasAnyRole(
  member,
  roleIds
) {

  if (!member?.roles?.cache) {
    return false;
  }

  return roleIds.some(
    roleId =>
      member.roles.cache.has(
        roleId
      )
  );
}


/* =========================================================
   VERIFICAÇÃO ADMINISTRATIVA
========================================================= */

async function requireAdmin(
  interaction
) {

  if (
    !interaction.guild ||
    !interaction.member
  ) {

    return false;
  }

  if (
    hasAnyRole(
      interaction.member,
      CONFIG.adminRoles
    )
  ) {

    return true;
  }

  await interaction.reply({
    content:
      '❌ Você não possui um dos cargos administrativos autorizados.',
    ephemeral: true
  });

  return false;
}


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatTime(
  date
) {

  return `<t:${Math.floor(
    date.getTime() / 1000
  )}:T>`;
}


function formatDuration(
  minutes
) {

  return minutes === 1
    ? '1 minuto'
    : `${minutes} minutos`;
}


function formatDurationMs(
  ms
) {

  if (
    !ms ||
    ms < 0
  ) {

    ms = 0;
  }

  const totalSeconds =
    Math.floor(
      ms / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  return (
    `${String(hours).padStart(2, '0')}h ` +
    `${String(minutes).padStart(2, '0')}m ` +
    `${String(seconds).padStart(2, '0')}s`
  );
}


/* =========================================================
   SEMANA ATUAL
========================================================= */

function getSemanaAtual() {

  const agora =
    new Date();

  const data =
    new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );

  const dia =
    data.getDay();

  const diferenca =
    dia === 0
      ? 6
      : dia - 1;

  data.setDate(
    data.getDate() -
    diferenca
  );

  data.setHours(
    0,
    0,
    0,
    0
  );

  return data
    .toISOString()
    .slice(0, 10);
}


/* =========================================================
   DADOS DO MEMBRO NO PONTO
========================================================= */

function garantirMembroPonto(
  userId
) {

  const semana =
    getSemanaAtual();

  if (
    !pontos[userId]
  ) {

    pontos[userId] = {

      semana,

      semanal: 0,

      total: 0

    };
  }

  if (
    pontos[userId].semana !==
    semana
  ) {

    pontos[userId].semana =
      semana;

    pontos[userId].semanal =
      0;

    salvarPontos();
  }

  return pontos[userId];
}


/* =========================================================
   CALL PERMITIDA
========================================================= */

function membroEstaEmCallPermitida(
  member
) {

  if (
    !member?.voice?.channelId
  ) {

    return false;
  }

  return CONFIG.pontoVoiceChannels
    .includes(
      member.voice.channelId
    );
}


/* =========================================================
   LOGS
========================================================= */

async function sendLog(
  guild,
  content
) {

  if (
    !guild ||
    !CONFIG.logChannelId
  ) {

    return;
  }

  const channel =
    guild.channels.cache.get(
      CONFIG.logChannelId
    );

  if (
    !channel?.isTextBased()
  ) {

    return;
  }

  await channel
    .send({
      content
    })
    .catch(() => {});
}


/* =========================================================
   PAINEL DE EDITAL
========================================================= */

function panelEmbed() {

  return new EmbedBuilder()

    .setColor(0x8b0000)

    .setTitle(
      '📜・EDITAL • PAVUNA'
    )

    .setDescription(

      [
        '## 🏴 PROCESSO DE RECRUTAMENTO',

        '',

        '🚨 Está preparado para fazer parte da **Pavuna**?',

        '',

        'Clique no botão abaixo para iniciar seu processo seletivo.',

        '',

        '### 📌 COMO FUNCIONA',

        '> 🔒 Um canal privado será criado para você.',

        '> ⏱️ Cada pergunta possui seu próprio tempo.',

        '> 🎯 Questões objetivas serão respondidas pelos botões.',

        '> ✍️ Questões discursivas devem ser respondidas por mensagem.',

        '> 🧹 As respostas serão apagadas automaticamente.',

        '> ⏰ O tempo será encerrado automaticamente.',

        '> 🎯 É necessário acertar todas as questões objetivas.',

        '',

        '🍀 **Boa sorte no processo!**'

      ].join('\n')

    )

    .setImage(
      CONFIG.editalImage
    )

    .setFooter({
      text:
        '🏴 Pavuna • Sistema Oficial de Recrutamento'
    })

    .setTimestamp();
}


function panelRow() {

  return new ActionRowBuilder()

    .addComponents(

      new ButtonBuilder()

        .setCustomId(
          'fazer_edital'
        )

        .setLabel(
          'Fazer Edital'
        )

        .setEmoji('📜')

        .setStyle(
          ButtonStyle.Primary
        )

    );
}


/* =========================================================
   REGISTRO
========================================================= */

function registrarEmbed() {

  return new EmbedBuilder()

    .setColor(0x8b0000)

    .setTitle(
      '📋・REGISTRO • PAVUNA'
    )

    .setDescription(

      [
        '## 🏴 SISTEMA OFICIAL DE REGISTRO',

        '',

        '👋 Bem-vindo ao sistema de registro da **Pavuna**.',

        '',

        'Clique no botão abaixo para realizar seu registro.',

        '',

        '### 📌 COMO FUNCIONA',

        '> 📝 Clique em **Registrar**.',

        '> 👤 Informe seu **Nick**.',

        '> 🆔 Informe seu **ID**.',

        '> ⚙️ Seu apelido será atualizado automaticamente.',

        '',

        '### 🏷️ FORMATO',

        '> `⋆ 𝓟𝓥𝓝 ⋆ 𝓝𝓞𝓜𝓔 ⋆𝓘𝓓`',

        '',

        '### 💡 EXEMPLO',

        '> `⋆ 𝓟𝓥𝓝 ⋆ 𝓫𝓲𝓼𝓹𝓸 ⋆1325`',

        '',

        '⚠️ **Confira seus dados antes de enviar.**'

      ].join('\n')

    )

    .setImage(
      CONFIG.registrarImage
    )

    .setFooter({
      text:
        '🏴 Pavuna • Sistema de Registro'
    })

    .setTimestamp();
}


function registrarRow() {

  return new ActionRowBuilder()

    .addComponents(

      new ButtonBuilder()

        .setCustomId(
          'abrir_registro'
        )

        .setLabel(
          'Registrar'
        )

        .setEmoji('📝')

        .setStyle(
          ButtonStyle.Primary
        )

    );
}


/* =========================================================
   MODAL DE REGISTRO
========================================================= */

async function abrirModalRegistro(
  interaction
) {

  const modal =
    new ModalBuilder()

      .setCustomId(
        'modal_registro'
      )

      .setTitle(
        '📋 Registro • Pavuna'
      );

  const nickInput =
    new TextInputBuilder()

      .setCustomId(
        'registro_nick'
      )

      .setLabel(
        'Qual é o seu Nick?'
      )

      .setPlaceholder(
        'Ex: bispo'
      )

      .setStyle(
        TextInputStyle.Short
      )

      .setMinLength(1)

      .setMaxLength(20)

      .setRequired(true);

  const idInput =
    new TextInputBuilder()

      .setCustomId(
        'registro_id'
      )

      .setLabel(
        'Qual é o seu ID?'
      )

      .setPlaceholder(
        'Ex: 1325'
      )

      .setStyle(
        TextInputStyle.Short
      )

      .setMinLength(1)

      .setMaxLength(10)

      .setRequired(true);

  modal.addComponents(

    new ActionRowBuilder()
      .addComponents(
        nickInput
      ),

    new ActionRowBuilder()
      .addComponents(
        idInput
      )

  );

  return interaction.showModal(
    modal
  );
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

  if (
    !nick ||
    !id
  ) {

    return interaction.reply({
      content:
        '❌ Nick e ID são obrigatórios.',
      ephemeral: true
    });
  }

  if (
    !/^\d+$/.test(id)
  ) {

    return interaction.reply({
      content:
        '❌ O ID deve conter somente números.',
      ephemeral: true
    });
  }

  const novoNome =
    `⋆ 𝓟𝓥𝓝 ⋆ ${nick} ⋆${id}`;

  if (
    novoNome.length > 32
  ) {

    return interaction.reply({
      content:
        '❌ O apelido ficou muito grande. Diminua o Nick.',
      ephemeral: true
    });
  }

  const member =
    interaction.member;

  if (
    !member?.manageable
  ) {

    return interaction.reply({
      content:
        '❌ Não consigo alterar seu apelido. Verifique a hierarquia do bot e a permissão **Gerenciar Apelidos**.',
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

          .setTitle(
            '✅・REGISTRO CONCLUÍDO'
          )

          .setDescription(

            [
              `👤 **Membro:** ${member}`,

              '',

              `🏷️ **Nick:** ${nick}`,

              `🆔 **ID:** ${id}`,

              '',

              '✨ **Novo nome:**',

              `> ${novoNome}`,

              '',

              '🎉 Seu registro foi realizado com sucesso!'

            ].join('\n')

          )

          .setFooter({
            text:
              '🏴 Pavuna • Sistema de Registro'
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
      '❌ Erro no registro:',
      error
    );

    if (
      !interaction.replied
    ) {

      await interaction.reply({
        content:
          '❌ Não foi possível alterar seu apelido.',
        ephemeral: true
      });
    }
  }
}


/* =========================================================
   BATE-PONTO
========================================================= */

function pontoPainelEmbed() {

  return new EmbedBuilder()

    .setColor(0x8b0000)

    .setTitle(
      '🕐・BATE-PONTO • PAVUNA'
    )

    .setDescription(

      [
        '## 🏴 CONTROLE DE HORÁRIOS',

        '',

        'Olá! Seja bem-vindo ao **Bate-Ponto da Pavuna**.',

        '',

        'Aqui você registra seus horários e acompanha sua atividade na facção.',

        '',

        '### 📌 REGRAS',

        '> 🎙️ Para iniciar o ponto, você precisa estar em uma call autorizada.',

        '> ▶️ Clique em **COMEÇAR** para iniciar.',

        '> 🔒 Clique em **FECHAR** quando terminar.',

        '> 🏆 Use **RANKING** para consultar as horas.',

        '> ⏱️ A meta semanal é de **7 horas**.',

        '',

        '### ⚠️ IMPORTANTE',

        '> 🚪 Ao sair de uma call autorizada, seu ponto será encerrado automaticamente.',

        '> 📊 Suas horas são contabilizadas semanalmente.',

        '',

        '🔥 **Mantenha sua atividade em dia!**'

      ].join('\n')

    )

    .setFooter({
      text:
        '🏴 Pavuna • Sistema de Bate-Ponto'
    })

    .setTimestamp();
}


function pontoPainelRow() {

  return new ActionRowBuilder()

    .addComponents(

      new ButtonBuilder()
        .setCustomId(
          'ponto_comecar'
        )
        .setLabel(
          'COMEÇAR'
        )
        .setEmoji('▶️')
        .setStyle(
          ButtonStyle.Success
        ),

      new ButtonBuilder()
        .setCustomId(
          'ponto_fechar'
        )
        .setLabel(
          'FECHAR'
        )
        .setEmoji('🔒')
        .setStyle(
          ButtonStyle.Danger
        ),

      new ButtonBuilder()
        .setCustomId(
          'ponto_ranking'
        )
        .setLabel(
          'RANKING'
        )
        .setEmoji('🏆')
        .setStyle(
          ButtonStyle.Primary
        )

    );
}


/* =========================================================
   INICIAR PONTO
========================================================= */

async function iniciarPonto(
  interaction
) {

  const member =
    interaction.member;

  if (
    pontosAtivos.has(
      member.id
    )
  ) {

    return interaction.reply({
      content:
        '⚠️ Você já possui um ponto em andamento.',
      ephemeral: true
    });
  }

  if (
    !membroEstaEmCallPermitida(
      member
    )
  ) {

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setColor(0xff3333)

          .setTitle(
            '❌・NÃO FOI POSSÍVEL INICIAR'
          )

          .setDescription(

            [
              'Você precisa estar em uma **call autorizada**.',
              '',
              '🎙️ Entre em uma das salas oficiais e tente novamente.',
              '',
              '⏱️ O tempo começará somente após clicar em **COMEÇAR**.'
            ].join('\n')

          )

      ],

      ephemeral: true

    });
  }

  const dados =
    garantirMembroPonto(
      member.id
    );

  const inicio =
    Date.now();

  pontosAtivos.set(
    member.id,
    {
      inicio,
      channelId:
        member.voice.channelId
    }
  );

  await interaction.reply({

    embeds: [

      new EmbedBuilder()

        .setColor(0x00cc66)

        .setTitle(
          '▶️・PONTO INICIADO'
        )

        .setDescription(

          [
            `👤 **Membro:** ${member}`,
            '',
            `🎙️ **Call:** <#${member.voice.channelId}>`,
            `🕐 **Início:** <t:${Math.floor(inicio / 1000)}:T>`,
            '',
            `📊 **Semana:** ${formatDurationMs(dados.semanal)}`,
            `🎯 **Meta:** ${formatDurationMs(CONFIG.pontoMetaSemanalMs)}`,
            '',
            '🔥 **Bom trabalho!**'
          ].join('\n')

        )

        .setFooter({
          text:
            '🏴 Pavuna • Bate-Ponto'
        })

        .setTimestamp()

    ],

    ephemeral: true

  });
}


/* =========================================================
   FECHAR PONTO
========================================================= */

async function fecharPonto(
  interaction,
  motivo =
    'Ponto encerrado manualmente'
) {

  const member =
    interaction.member;

  const ativo =
    pontosAtivos.get(
      member.id
    );

  if (!ativo) {

    return interaction.reply({
      content:
        '⚠️ Você não possui um ponto em andamento.',
      ephemeral: true
    });
  }

  const tempo =
    Date.now() -
    ativo.inicio;

  const dados =
    garantirMembroPonto(
      member.id
    );

  dados.semanal +=
    tempo;

  dados.total +=
    tempo;

  pontosAtivos.delete(
    member.id
  );

  salvarPontos();

  const meta =
    dados.semanal >=
    CONFIG.pontoMetaSemanalMs;

  await interaction.reply({

    embeds: [

      new EmbedBuilder()

        .setColor(
          meta
            ? 0x00cc66
            : 0xff9900
        )

        .setTitle(
          meta
            ? '🏆・PONTO ENCERRADO'
            : '🔒・PONTO ENCERRADO'
        )

        .setDescription(

          [
            `👤 **Membro:** ${member}`,
            '',
            `⏱️ **Jornada:** ${formatDurationMs(tempo)}`,
            `📊 **Semana:** ${formatDurationMs(dados.semanal)}`,
            `📚 **Total:** ${formatDurationMs(dados.total)}`,
            '',
            `🎯 **Meta de 7h:** ${meta ? '✅ CONCLUÍDA' : '⏳ EM ANDAMENTO'}`,
            '',
            `📌 **Motivo:** ${motivo}`
          ].join('\n')

        )

        .setFooter({
          text:
            '🏴 Pavuna • Bate-Ponto'
        })

        .setTimestamp()

    ],

    ephemeral: true

  });

  await sendLog(
    interaction.guild,
    [
      '🕐 **PONTO ENCERRADO**',
      '',
      `👤 Membro: <@${member.id}>`,
      `⏱️ Jornada: ${formatDurationMs(tempo)}`,
      `📊 Semana: ${formatDurationMs(dados.semanal)}`,
      `📚 Total: ${formatDurationMs(dados.total)}`,
      `📌 Motivo: ${motivo}`
    ].join('\n')
  );
}


/* =========================================================
   RANKING
========================================================= */

async function mostrarRanking(
  interaction
) {

  if (
    !hasAnyRole(
      interaction.member,
      CONFIG.adminRoles
    )
  ) {

    return interaction.reply({
      content:
        '❌ Você não possui um dos 3 cargos autorizados para visualizar o ranking.',
      ephemeral: true
    });
  }

  const lista = [];

  for (
    const [
      userId,
      dados
    ]
    of Object.entries(pontos)
  ) {

    garantirMembroPonto(
      userId
    );

    let semanal =
      dados.semanal || 0;

    const ativo =
      pontosAtivos.get(
        userId
      );

    if (ativo) {

      semanal +=
        Date.now() -
        ativo.inicio;
    }

    lista.push({

      userId,

      semanal,

      total:
        dados.total || 0

    });
  }

  for (
    const [
      userId,
      ativo
    ]
    of pontosAtivos
  ) {

    if (
      lista.some(
        item =>
          item.userId ===
          userId
      )
    ) {

      continue;
    }

    const dados =
      garantirMembroPonto(
        userId
      );

    lista.push({

      userId,

      semanal:
        dados.semanal +
        (
          Date.now() -
          ativo.inicio
        ),

      total:
        dados.total

    });
  }

  lista.sort(
    (a, b) =>
      b.semanal -
      a.semanal
  );

  const top =
    lista.slice(
      0,
      20
    );

  if (
    !top.length
  ) {

    return interaction.reply({

      embeds: [

        new EmbedBuilder()

          .setColor(0xff9900)

          .setTitle(
            '🏆・RANKING DE BATE-PONTO'
          )

          .setDescription(
            '📊 Ainda não existem registros de horas.'
          )

      ],

      ephemeral: true

    });
  }

  const linhas = [];

  for (
    let i = 0;
    i < top.length;
    i++
  ) {

    const item =
      top[i];

    const member =
      await interaction.guild.members
        .fetch(
          item.userId
        )
        .catch(
          () => null
        );

    const nome =
      member
        ? member.displayName
        : `Usuário ${item.userId}`;

    let posicao =
      `${i + 1}º`;

    if (i === 0)
      posicao = '🥇';

    if (i === 1)
      posicao = '🥈';

    if (i === 2)
      posicao = '🥉';

    const meta =
      item.semanal >=
      CONFIG.pontoMetaSemanalMs
        ? '✅'
        : '⏳';

    linhas.push(

      `${posicao} **${nome}**\n` +

      `> ⏱️ Semana: **${formatDurationMs(item.semanal)}** ${meta}\n` +

      `> 📚 Total: **${formatDurationMs(item.total)}**`

    );
  }

  return interaction.reply({

    embeds: [

      new EmbedBuilder()

        .setColor(0x8b0000)

        .setTitle(
          '🏆・RANKING DE BATE-PONTO'
        )

        .setDescription(

          [
            '📊 **Ranking semanal da Pavuna**',
            '',
            `🎯 **Meta:** ${formatDurationMs(CONFIG.pontoMetaSemanalMs)}`,
            '',
            linhas.join('\n\n')
          ].join('\n')

        )

        .setFooter({
          text:
            '🏴 Pavuna • Ranking de Atividade'
        })

        .setTimestamp()

    ],

    ephemeral: true

  });
}


/* =========================================================
   VOICE STATE
========================================================= */

client.on(
  'voiceStateUpdate',
  async (
    oldState,
    newState
  ) => {

    try {

      const userId =
        oldState.id;

      const ativo =
        pontosAtivos.get(
          userId
        );

      if (!ativo)
        return;

      const oldAllowed =
        CONFIG.pontoVoiceChannels
          .includes(
            oldState.channelId
          );

      const newAllowed =
        CONFIG.pontoVoiceChannels
          .includes(
            newState.channelId
          );

      if (
        oldAllowed &&
        newAllowed
      ) {

        ativo.channelId =
          newState.channelId;

        return;
      }

      if (
        oldAllowed &&
        !newAllowed
      ) {

        const tempo =
          Date.now() -
          ativo.inicio;

        const dados =
          garantirMembroPonto(
            userId
          );

        dados.semanal +=
          tempo;

        dados.total +=
          tempo;

        pontosAtivos.delete(
          userId
        );

        salvarPontos();

        const meta =
          dados.semanal >=
          CONFIG.pontoMetaSemanalMs;

        const member =
          await newState.guild.members
            .fetch(
              userId
            )
            .catch(
              () => null
            );

        if (member) {

          try {

            await member.send({

              embeds: [

                new EmbedBuilder()

                  .setColor(
                    meta
                      ? 0x00cc66
                      : 0xff9900
                  )

                  .setTitle(
                    '🚪・PONTO ENCERRADO'
                  )

                  .setDescription(

                    [
                      'Você saiu de uma call autorizada.',
                      '',
                      `⏱️ **Jornada:** ${formatDurationMs(tempo)}`,
                      `📊 **Semana:** ${formatDurationMs(dados.semanal)}`,
                      `📚 **Total:** ${formatDurationMs(dados.total)}`,
                      '',
                      meta
                        ? '🏆 Você atingiu a meta semanal!'
                        : '⚠️ Seu ponto foi encerrado automaticamente.'
                    ].join('\n')

                  )

                  .setFooter({
                    text:
                      '🏴 Pavuna • Bate-Ponto'
                  })

                  .setTimestamp()

              ]

            });

          } catch {}
        }

        await sendLog(
          newState.guild,
          [
            '🚪 **PONTO ENCERRADO AUTOMATICAMENTE**',
            '',
            `👤 Membro: <@${userId}>`,
            `⏱️ Jornada: ${formatDurationMs(tempo)}`,
            `📊 Semana: ${formatDurationMs(dados.semanal)}`,
            `📌 Motivo: saiu da call autorizada.`
          ].join('\n')
        );
      }

    } catch (error) {

      console.error(
        '❌ Erro no voiceStateUpdate:',
        error
      );
    }
  }
);


/* =========================================================
   EDITAL
========================================================= */

function startRow() {

  return new ActionRowBuilder()

    .addComponents(

      new ButtonBuilder()
        .setCustomId(
          'iniciar_edital'
        )
        .setLabel(
          'Iniciar Edital'
        )
        .setEmoji('▶️')
        .setStyle(
          ButtonStyle.Success
        ),

      new ButtonBuilder()
        .setCustomId(
          'fechar_edital'
        )
        .setLabel(
          'Fechar'
        )
        .setEmoji('🔒')
        .setStyle(
          ButtonStyle.Danger
        )

    );
}


function answerButtons(
  questionNumber
) {

  return new ActionRowBuilder()

    .addComponents(

      ['A', 'B', 'C', 'D']
        .map(
          letter =>

            new ButtonBuilder()

              .setCustomId(
                `edital_${questionNumber}_${letter}`
              )

              .setLabel(
                letter
              )

              .setStyle(
                ButtonStyle.Primary
              )
        )

    );
}


function questionEmbed(
  q,
  startedAt,
  deadline
) {

  const embed =
    new EmbedBuilder()

      .setColor(0x8b0000)

      .setTitle(
        `📋・EDITAL PAVUNA • PERGUNTA ${String(q.n).padStart(2, '0')}/11`
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
        text:
          '🏴 Pavuna • Processo Seletivo'
      });

  if (
    q.options
  ) {

    embed.addFields({

      name:
        '🎯 Escolha uma alternativa',

      value:

        `🅰️ **A)** ${q.options[0]}\n` +
        `🅱️ **B)** ${q.options[1]}\n` +
        `©️ **C)** ${q.options[2]}\n` +
        `🇩 **D)** ${q.options[3]}`

    });
  }

  return embed;
}


/* =========================================================
   FECHAMENTO DE CANAL
========================================================= */

function deleteAfter(
  channel,
  reason
) {

  setTimeout(
    () => {

      channel
        .delete(reason)
        .catch(
          () => {}
        );

    },
    CONFIG.closeAfterMs
  );
}


async function closeChannel(
  channel,
  reason
) {

  await channel.send({

    embeds: [

      new EmbedBuilder()

        .setColor(0x8b0000)

        .setTitle(
          '🔒・EDITAL ENCERRADO'
        )

        .setDescription(
          'Este canal será excluído automaticamente em **5 segundos**.'
        )

        .setFooter({
          text:
            reason
        })

    ]

  }).catch(
    () => {}
  );

  deleteAfter(
    channel,
    reason
  );
}


/* =========================================================
   CRIAR CANAL DO EDITAL
========================================================= */

async function createEditalChannel(
  interaction
) {

  const guild =
    interaction.guild;

  const member =
    interaction.member;

  if (
    !guild ||
    !member
  ) {

    return interaction.reply({
      content:
        '❌ Não foi possível iniciar o edital.',
      ephemeral: true
    });
  }

  if (
    sessions.has(
      member.id
    )
  ) {

    const session =
      sessions.get(
        member.id
      );

    return interaction.reply({

      content:
        `❌ Você já possui um edital em andamento.\n\n📋 Canal: <#${session.channelId}>`,

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
      id:
        guild.roles.everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    ...CONFIG.editalAccessRoles
      .map(
        roleId => ({

          id:
            roleId,

          allow: [

            PermissionFlagsBits.ViewChannel,

            PermissionFlagsBits.SendMessages,

            PermissionFlagsBits.ReadMessageHistory

          ]

        })
      ),

    {
      id:
        member.id,

      allow: [

        PermissionFlagsBits.ViewChannel,

        PermissionFlagsBits.SendMessages,

        PermissionFlagsBits.ReadMessageHistory

      ]
    },

    {
      id:
        botMember.id,

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

      .slice(
        0,
        60
      );

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
      '❌ Erro ao criar canal:',
      error
    );

    return interaction.reply({
      content:
        '❌ Não consegui criar o canal do edital. Verifique as permissões do bot.',
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

  await channel.send({

    content:
      `${member}`,

    embeds: [

      new EmbedBuilder()

        .setColor(0x8b0000)

        .setTitle(
          '📋・EDITAL PAVUNA'
        )

        .setDescription(

          [
            `👋 Olá, ${member}!`,
            '',
            'Seu canal privado de recrutamento foi criado.',
            '',
            '### ⚠️ ANTES DE COMEÇAR',
            '',
            '📖 Leia todas as perguntas com atenção.',
            '⏱️ O cronômetro começa ao clicar em **Iniciar Edital**.',
            '⌛ Cada pergunta possui seu próprio tempo.',
            '🚫 Se o tempo acabar, o processo será encerrado.',
            '✍️ Questões **1–5 e 11** são discursivas.',
            '🎯 Questões **6–10** possuem alternativas.',
            '🏆 É necessário acertar as **5 questões objetivas**.',
            '',
            'Clique em **▶️ Iniciar Edital** quando estiver pronto.',
            '',
            '🍀 **Boa sorte!**'
          ].join('\n')

        )

        .setFooter({
          text:
            '🏴 Pavuna • Sistema de Recrutamento'
        })

        .setTimestamp()

    ],

    components: [
      startRow()
    ]

  });

  await interaction.reply({

    content:
      `✅ **Edital criado com sucesso!**\n\n📋 ${channel}`,

    ephemeral: true

  });
}


/* =========================================================
   REPROVAR POR TEMPO
========================================================= */

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
          '⏰・TEMPO ESGOTADO'
        )

        .setDescription(

          [
            `O tempo da **pergunta ${questionNumber}/11** acabou.`,
            '',
            '❌ **Edital reprovado.**',
            '',
            '📚 Estude as regras e tente novamente em outro momento.'
          ].join('\n')

        )

        .setFooter({
          text:
            '🏴 Pavuna • Processo Seletivo'
        })

    ]

  }).catch(
    () => {}
  );

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


/* =========================================================
   EXECUTAR EDITAL
========================================================= */

async function runEdital(
  channel,
  member
) {

  const session =
    sessions.get(
      member.id
    );

  if (!session)
    return;

  if (
    session.started
  )
    return;

  session.started =
    true;

  await channel.send({

    embeds: [

      new EmbedBuilder()

        .setColor(0x00aa55)

        .setTitle(
          '🚀・EDITAL INICIADO'
        )

        .setDescription(
          [
            'O processo seletivo começou!',
            '',
            '⏱️ Responda cada pergunta dentro do tempo indicado.',
            '🍀 Boa sorte!'
          ].join('\n')
        )

    ]

  });

  for (
    const q of QUESTIONS
  ) {

    if (
      !sessions.has(
        member.id
      )
    )
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

    /* =====================================================
       QUESTÃO OBJETIVA
    ===================================================== */

    if (
      q.options
    ) {

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

            answerButtons(
              q.n
            )

          ]

        });

      const collected =
        await questionMessage
          .awaitMessageComponent({

            filter:
              buttonInteraction =>

                buttonInteraction.user.id ===
                  member.id &&

                buttonInteraction.customId
                  .startsWith(
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
          .catch(
            () => {}
          );

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
        .catch(
          () => {}
        );

      await questionMessage
        .delete()
        .catch(
          () => {}
        );

      continue;
    }

    /* =====================================================
       QUESTÃO DISCURSIVA
    ===================================================== */

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
        .catch(
          () => {}
        );

      await rejectByTimeout(
        channel,
        member,
        q.n
      );

      return;
    }

    const answerMessage =
      collected.first();

    session.answers.push({

      question:
        q.n,

      answer:
        answerMessage.content.trim()

    });

    await answerMessage
      .delete()
      .catch(
        () => {}
      );

    await questionMessage
      .delete()
      .catch(
        () => {}
      );
  }

  await finishEdital(
    channel,
    member,
    session
  );
}


/* =========================================================
   FINALIZAR EDITAL
========================================================= */

async function finishEdital(
  channel,
  member,
  session
) {

  const approved =
    session.objectiveCorrect === 5;

  if (
    approved
  ) {

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

      const botMember =
        channel.guild.members.me;

      if (
        !botMember ||
        role.position >=
        botMember.roles.highest.position
      ) {

        console.warn(
          `⚠️ Cargo ${roleId} está acima do bot.`
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
            '🎉・EDITAL APROVADO!'
          )

          .setDescription(

            [
              `🏴 Parabéns, ${member}!`,
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
                        `> 🏷️ **${role}**`
                    )
                    .join('\n')

                : '> ⚠️ Nenhum cargo pôde ser atribuído.',

              '',
              '━━━━━━━━━━━━━━━━━━━━',
              '',
              '🏴 **BEM-VINDO À PAVUNA!**'

            ].join('\n')

          )

          .setFooter({
            text:
              '🏴 Pavuna • Recrutamento'
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
            '📕・EDITAL REPROVADO'
          )

          .setDescription(

            [
              `😕 Infelizmente, ${member}, você não atingiu a pontuação necessária.`,
              '',
              `📊 **Questões objetivas:** ${session.objectiveCorrect}/5`,
              '',
              '🎯 É necessário acertar as **5 questões objetivas**.',
              '',
              '📚 Estude as regras do servidor e do RP.',
              '',
              '🔄 Tente novamente em outro momento.',
              '',
              '🍀 **Boa sorte na próxima tentativa!**'
            ].join('\n')

          )

          .setFooter({
            text:
              '🏴 Pavuna • Recrutamento'
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


/* =========================================================
   VALIDAÇÃO DE PROMOÇÃO / REBAIXAMENTO
========================================================= */

function validarAlteracaoCargo(
  interaction,
  target,
  oldRole,
  newRole
) {

  if (!target)
    return '❌ Não encontrei esse membro no servidor.';

  if (!oldRole || !newRole)
    return '❌ Um dos cargos informados é inválido.';

  if (
    target.id ===
    interaction.user.id
  ) {

    return '❌ Você não pode alterar seu próprio cargo.';
  }

  if (
    oldRole.id ===
    newRole.id
  ) {

    return '❌ O cargo antigo e o novo cargo não podem ser iguais.';
  }

  if (
    !target.roles.cache.has(
      oldRole.id
    )
  ) {

    return `❌ O membro não possui o cargo ${oldRole}.`;
  }

  if (
    oldRole.managed ||
    newRole.managed
  ) {

    return '❌ Cargos gerenciados pelo Discord não podem ser utilizados.';
  }

  const botMember =
    interaction.guild.members.me;

  if (!botMember)
    return '❌ Não consegui verificar a hierarquia do bot.';

  if (
    oldRole.position >=
    botMember.roles.highest.position
  ) {

    return '❌ O cargo antigo está acima ou no mesmo nível do bot.';
  }

  if (
    newRole.position >=
    botMember.roles.highest.position
  ) {

    return '❌ O novo cargo está acima ou no mesmo nível do bot.';
  }

  if (
    target.roles.highest.position >=
    botMember.roles.highest.position
  ) {

    return '❌ O bot não possui hierarquia suficiente para alterar este membro.';
  }

  return null;
}


/* =========================================================
   EXECUTAR PROMOÇÃO / REBAIXAMENTO
========================================================= */

async function executarAlteracaoCargo(
  interaction,
  tipo,
  target,
  oldRole,
  newRole,
  motivo
) {

  const erro =
    validarAlteracaoCargo(
      interaction,
      target,
      oldRole,
      newRole
    );

  if (erro) {

    return interaction.reply({
      content:
        erro,
      ephemeral: true
    });
  }

  if (
    !motivo ||
    !motivo.trim()
  ) {

    return interaction.reply({
      content:
        '❌ O motivo é obrigatório.',
      ephemeral: true
    });
  }

  try {

    await target.roles.remove(

      oldRole,

      `${tipo} por ${interaction.user.tag}: ${motivo}`

    );

    await target.roles.add(

      newRole,

      `${tipo} por ${interaction.user.tag}: ${motivo}`

    );

  } catch (error) {

    console.error(
      `❌ Erro na ${tipo}:`,
      error
    );

    return interaction.reply({
      content:
        '❌ Não foi possível alterar os cargos. Verifique a hierarquia do bot.',
      ephemeral: true
    });
  }

  const isPromocao =
    tipo === 'Promoção';

  await interaction.reply({

    embeds: [

      new EmbedBuilder()

        .setColor(
          isPromocao
            ? 0x00aaff
            : 0xff9900
        )

        .setTitle(

          isPromocao
            ? '📈・PROMOÇÃO REGISTRADA'
            : '📉・REBAIXAMENTO REGISTRADO'

        )

        .setDescription(

          [
            `👤 **Membro:** ${target}`,
            `👑 **Responsável:** ${interaction.member}`,
            '',
            `📋 **Cargo anterior:** ${oldRole}`,
            `🏷️ **Novo cargo:** ${newRole}`,
            '',
            `📝 **Motivo:** ${motivo}`,
            '',
            isPromocao
              ? '🎉 **Promoção registrada com sucesso!**'
              : '⚠️ **Rebaixamento registrado com sucesso.**'
          ].join('\n')

        )

        .setFooter({
          text:
            '🏴 Pavuna • Administração'
        })

        .setTimestamp()

    ]

  });

  await sendLog(

    interaction.guild,

    [
      isPromocao
        ? '📈 **PROMOÇÃO**'
        : '📉 **REBAIXAMENTO**',

      '',

      `👑 Responsável: <@${interaction.user.id}>`,

      `👤 Membro: <@${target.id}>`,

      `📋 Antigo: <@&${oldRole.id}>`,

      `🏷️ Novo: <@&${newRole.id}>`,

      `📝 Motivo: ${motivo}`

    ].join('\n')

  );
}

// ... suas funções anteriores


/* =========================================================
   SISTEMA DE TICKETS
========================================================= */

/* =========================================================
   SISTEMA DE TICKETS
========================================================= */

const ticketCategories = {
  encomendas: {
    label: 'Encomendas',
    emoji: '📦',
    description: 'Dúvidas ou assuntos relacionados a encomendas.'
  },

  denuncias: {
    label: 'Denúncias',
    emoji: '🚨',
    description: 'Realize uma denúncia para a administração.'
  },

  duvidas: {
    label: 'Dúvidas',
    emoji: '❓',
    description: 'Tire suas dúvidas com a equipe.'
  },

  outros: {
    label: 'Outros Assuntos',
    emoji: '📌',
    description: 'Outros assuntos que não se encaixam nas categorias.'
  }
};


/* =========================================================
   EMBED DO PAINEL
========================================================= */

function ticketPanelEmbed() {

  return new EmbedBuilder()

    .setColor(0x8b0000)

    .setTitle(
      '🎫・CENTRAL DE ATENDIMENTO • PAVUNA'
    )

    .setDescription([

      '## 🏴 SISTEMA DE TICKETS',

      '',

      'Olá! Seja bem-vindo à central de atendimento da **Pavuna**.',

      '',

      'Selecione abaixo o motivo do seu atendimento.',

      '',

      '### 📂 CATEGORIAS',

      '📦 **Encomendas**',
      '> Assuntos relacionados a encomendas.',

      '',
      '🚨 **Denúncias**',
      '> Denúncias para a administração.',

      '',
      '❓ **Dúvidas**',
      '> Tire suas dúvidas com a equipe.',

      '',
      '📌 **Outros Assuntos**',
      '> Para assuntos que não se encaixam nas opções acima.',

      '',
      '⚠️ **Não abra tickets sem necessidade.**',
      '🚨 Tickets sem conteúdo poderão ser encerrados pela equipe.',

      '',
      '🏴 **Pavuna • Atendimento Oficial**'

    ].join('\n'))

    .setImage(
      CONFIG.ticketImage
    )

    .setFooter({
      text:
        '🏴 Pavuna • Sistema de Tickets'
    })

    .setTimestamp();
}


/* =========================================================
   SELECT MENU
========================================================= */

function ticketSelectMenu() {

  return new ActionRowBuilder()

    .addComponents(

      new (require('discord.js').StringSelectMenuBuilder)()

        .setCustomId(
          'ticket_categoria'
        )

        .setPlaceholder(
          '🎫 Selecione o motivo do atendimento'
        )

        .addOptions(

          Object.entries(
            ticketCategories
          ).map(
            ([value, data]) =>

              new (require('discord.js').StringSelectMenuOptionBuilder)()

                .setLabel(
                  data.label
                )

                .setDescription(
                  data.description
                )

                .setEmoji(
                  data.emoji
                )

                .setValue(
                  value
                )
          )

        )

    );
}


/* =========================================================
   VERIFICAR EQUIPE
========================================================= */

function isTicketStaff(member) {

  return hasAnyRole(
    member,
    CONFIG.ticketStaffRoles
  );
}


/* =========================================================
   NOME SEGURO DO CANAL
========================================================= */

function cleanTicketName(text) {

  return text

    .toLowerCase()

    .normalize('NFD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    )

    .replace(
      /[^a-z0-9-]/g,
      '-'
    )

    .replace(
      /-+/g,
      '-'
    )

    .replace(
      /^-|-$/g,
      ''
    )

    .slice(
      0,
      50
    );
}


/* =========================================================
   VERIFICAR SE JÁ POSSUI TICKET
========================================================= */

function usuarioJaTemTicket(
  guild,
  userId
) {

  return guild.channels.cache.some(
    channel =>

      channel.topic &&
      channel.topic.includes(
        `ticketOwner:${userId}`
      )
  );
}


/* =========================================================
   CRIAR TICKET
========================================================= */

async function criarTicket(
  interaction,
  categoria
) {

  const guild =
    interaction.guild;

  const member =
    interaction.member;

  const dados =
    ticketCategories[categoria];

  if (
    !dados
  ) {

    return interaction.reply({

      content:
        '❌ Categoria de ticket inválida.',

      ephemeral: true

    });
  }


  /* =======================================================
     EVITAR TICKETS DUPLICADOS
  ======================================================= */

  if (
    usuarioJaTemTicket(
      guild,
      member.id
    )
  ) {

    const existente =
      guild.channels.cache.find(

        channel =>

          channel.topic &&
          channel.topic.includes(
            `ticketOwner:${member.id}`
          )

      );

    return interaction.reply({

      content:
        `⚠️ Você já possui um ticket aberto: ${existente || 'ticket existente'}`,

      ephemeral: true

    });
  }


  const botMember =
    guild.members.me;

  if (
    !botMember
  ) {

    return interaction.reply({

      content:
        '❌ Não consegui verificar as permissões do bot.',

      ephemeral: true

    });
  }


  /* =======================================================
     PERMISSÕES
  ======================================================= */

  const permissionOverwrites = [

    {
      id:
        guild.roles.everyone.id,

      deny: [

        PermissionFlagsBits.ViewChannel

      ]
    },


    /* DONO DO TICKET */

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


    /* EQUIPE */

    ...CONFIG.ticketStaffRoles.map(

      roleId => ({

        id:
          roleId,

        allow: [

          PermissionFlagsBits.ViewChannel,

          PermissionFlagsBits.SendMessages,

          PermissionFlagsBits.ReadMessageHistory,

          PermissionFlagsBits.AttachFiles

        ]

      })

    ),


    /* BOT */

    {
      id:
        botMember.id,

      allow: [

        PermissionFlagsBits.ViewChannel,

        PermissionFlagsBits.SendMessages,

        PermissionFlagsBits.ReadMessageHistory,

        PermissionFlagsBits.ManageChannels,

        PermissionFlagsBits.ManageMessages

      ]

    }

  ];


  const nomeUsuario =
    cleanTicketName(
      member.user.username
    );

  const nomeCategoria =
    cleanTicketName(
      dados.label
    );


  let channel;


  try {

    channel =
      await guild.channels.create({

        name:
          `${nomeUsuario}-${nomeCategoria}`,

        type:
          ChannelType.GuildText,

        parent:
          CONFIG.ticketCategoryId ||
          undefined,

        topic:
          [
            `ticketOwner:${member.id}`,
            `category:${categoria}`,
            'claimedBy:none'
          ].join('|'),

        permissionOverwrites,

        reason:
          `Ticket aberto por ${member.user.tag} • ${dados.label}`

      });

  } catch (error) {

    console.error(
      '❌ Erro ao criar ticket:',
      error
    );

    return interaction.reply({

      content:
        '❌ Não consegui criar o ticket. Verifique se o bot possui **Gerenciar Canais**.',

      ephemeral: true

    });

  }


  /* =======================================================
     EMBED DO TICKET
  ======================================================= */

  const ticketEmbed =

    new EmbedBuilder()

      .setColor(0x8b0000)

      .setTitle(
        `${dados.emoji}・TICKET • ${dados.label.toUpperCase()}`
      )

      .setDescription([

        `👋 Olá, ${member}!`,

        '',

        `📂 **Categoria:** ${dados.label}`,

        '',

        '⏳ **Aguarde um Superior te atender.**',

        '',

        '📝 Explique abaixo com o máximo de detalhes possível o motivo do seu atendimento.',

        '',

        '━━━━━━━━━━━━━━━━━━━━',

        '',

        '🛡️ A equipe poderá reivindicar este atendimento.',

        '🔒 Quando o atendimento terminar, utilize **Fechar**.',

        '',
        '🏴 **Pavuna • Atendimento Oficial**'

      ].join('\n'))

      .setFooter({

        text:
          '🏴 Pavuna • Sistema de Tickets'

      })

      .setTimestamp();


  await channel.send({

    content:
      `${member}`,

    embeds: [
      ticketEmbed
    ],

    components:
      ticketActionRows(false)

  });


  await interaction.reply({

    content:
      `✅ **Ticket criado com sucesso!**\n\n🎫 ${channel}`,

    ephemeral: true

  });


  await sendTicketLog(

    guild,

    [
      '🎫 **NOVO TICKET**',
      '',
      `👤 Usuário: <@${member.id}>`,
      `🆔 ID: ${member.id}`,
      `📂 Categoria: ${dados.label}`,
      `📌 Canal: ${channel}`,
      `🕐 Data: <t:${Math.floor(Date.now() / 1000)}:F>`
    ].join('\n')

  );

}


/* =========================================================
   BOTÕES DO TICKET
========================================================= */

function ticketActionRows(
  claimed
) {

  const buttonsRow =

    new ActionRowBuilder()

      .addComponents(

        new ButtonBuilder()

          .setCustomId(
            'ticket_reivindicar'
          )

          .setLabel(
            'Reivindicar'
          )

          .setEmoji('🛡️')

          .setStyle(
            ButtonStyle.Primary
          )

          .setDisabled(
            claimed
          ),


        new ButtonBuilder()

          .setCustomId(
            'ticket_fechar'
          )

          .setLabel(
            'Fechar'
          )

          .setEmoji('🔒')

          .setStyle(
            ButtonStyle.Danger
          )

      );


  const manageRow =

    new ActionRowBuilder()

      .addComponents(

        new (require('discord.js').StringSelectMenuBuilder)()

          .setCustomId(
            'ticket_gerenciar'
          )

          .setPlaceholder(
            '👤 Gerenciar participantes'
          )

          .addOptions(

            {

              label:
                'Adicionar um player',

              description:
                'Adiciona um membro ao ticket.',

              emoji:
                '➕',

              value:
                'adicionar'

            },

            {

              label:
                'Retirar um player',

              description:
                'Retira um membro do ticket.',

              emoji:
                '➖',

              value:
                'retirar'

            }

          )

      );


  return [
    buttonsRow,
    manageRow
  ];

}


/* =========================================================
   LOG DE TICKETS
========================================================= */

async function sendTicketLog(
  guild,
  content
) {

  const channelId =
    CONFIG.ticketLogChannelId ||
    CONFIG.logChannelId;

  if (
    !channelId
  )
    return;

  const channel =
    guild.channels.cache.get(
      channelId
    );

  if (
    !channel?.isTextBased()
  )
    return;

  await channel.send({
    content
  }).catch(
    () => {}
  );

}


/* =========================================================
   PEGAR DONO DO TICKET
========================================================= */

function getTicketOwnerId(
  channel
) {

  if (
    !channel?.topic
  )
    return null;

  const match =
    channel.topic.match(
      /ticketOwner:(\d+)/
    );

  return match
    ? match[1]
    : null;

}


/* =========================================================
   REIVINDICAR TICKET
========================================================= */

async function reivindicarTicket(
  interaction
) {

  if (
    !isTicketStaff(
      interaction.member
    )
  ) {

    return interaction.reply({

      content:
        '❌ Somente a equipe autorizada pode reivindicar tickets.',

      ephemeral: true

    });

  }


  const channel =
    interaction.channel;


  if (
    !channel?.topic ||
    !channel.topic.includes(
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


  if (
    match &&
    match[1] !== 'none'
  ) {

    return interaction.reply({

      content:
        `⚠️ Este ticket já foi reivindicado por <@${match[1]}>.`,

      ephemeral: true

    });

  }


  const novoTopic =
    channel.topic.replace(

      /claimedBy:[^|]+/,

      `claimedBy:${interaction.user.id}`

    );


  await channel.setTopic(
    novoTopic
  );


  await interaction.message.edit({

    components:
      ticketActionRows(true)

  }).catch(
    () => {}
  );


  await interaction.reply({

    embeds: [

      new EmbedBuilder()

        .setColor(0x00cc66)

        .setTitle(
          '🛡️・TICKET REIVINDICADO'
        )

        .setDescription([

          `👤 **Responsável:** ${interaction.user}`,

          '',

          '✅ Este atendimento foi assumido por um membro da equipe.',

          'Aguarde enquanto o atendimento é realizado.'

        ].join('\n'))

        .setTimestamp()

    ]

  });


  await sendTicketLog(

    interaction.guild,

    [
      '🛡️ **TICKET REIVINDICADO**',
      '',
      `👑 Responsável: <@${interaction.user.id}>`,
      `🎫 Canal: ${channel}`,
      `👤 Dono: <@${getTicketOwnerId(channel)}>`
    ].join('\n')

  );

}


/* =========================================================
   FECHAR TICKET
========================================================= */

async function fecharTicket(
  interaction
) {

  const channel =
    interaction.channel;

  const ownerId =
    getTicketOwnerId(
      channel
    );


  if (
    !ownerId
  ) {

    return interaction.reply({

      content:
        '❌ Este canal não é um ticket.',

      ephemeral: true

    });

  }


  const isOwner =
    interaction.user.id ===
    ownerId;

  const isStaff =
    isTicketStaff(
      interaction.member
    );


  if (
    !isOwner &&
    !isStaff
  ) {

    return interaction.reply({

      content:
        '❌ Somente o dono do ticket ou a equipe pode fechá-lo.',

      ephemeral: true

    });

  }


  await sendTicketLog(

    interaction.guild,

    [
      '🔒 **TICKET FECHADO**',
      '',
      `🎫 Canal: ${channel.name}`,
      `👤 Dono: <@${ownerId}>`,
      `🛡️ Fechado por: <@${interaction.user.id}>`
    ].join('\n')

  );


  await interaction.reply({

    embeds: [

      new EmbedBuilder()

        .setColor(0xff3333)

        .setTitle(
          '🔒・TICKET ENCERRADO'
        )

        .setDescription(
          'Este ticket será excluído automaticamente em **5 segundos**.'
        )

        .setTimestamp()

    ]

  });


  setTimeout(

    () => {

      channel
        .delete(
          'Ticket encerrado'
        )
        .catch(
          () => {}
        );

    },

    5000

  );

}


/* =========================================================
   MODAL DE PARTICIPANTE
========================================================= */

function participanteModal(
  acao
) {

  const modal =

    new ModalBuilder()

      .setCustomId(
        `ticket_participante:${acao}`
      )

      .setTitle(

        acao === 'adicionar'

          ? '➕ Adicionar Player'

          : '➖ Retirar Player'

      );


  const idInput =

    new TextInputBuilder()

      .setCustomId(
        'player_id'
      )

      .setLabel(
        'ID do Player'
      )

      .setPlaceholder(
        'Ex: 123456789012345678'
      )

      .setStyle(
        TextInputStyle.Short
      )

      .setMinLength(15)

      .setMaxLength(25)

      .setRequired(true);


  modal.addComponents(

    new ActionRowBuilder()
      .addComponents(
        idInput
      )

  );


  return modal;

}


/* =========================================================
   GERENCIAR PARTICIPANTE
========================================================= */

async function gerenciarParticipante(
  interaction,
  acao
) {

  if (
    !isTicketStaff(
      interaction.member
    )
  ) {

    return interaction.reply({

      content:
        '❌ Somente a equipe pode gerenciar participantes.',

      ephemeral: true

    });

  }


  return interaction.showModal(

    participanteModal(
      acao
    )

  );

}


/* =========================================================
   PROCESSAR PARTICIPANTE
========================================================= */

async function processarParticipante(
  interaction,
  acao
) {

  const id =
    interaction.fields
      .getTextInputValue(
        'player_id'
      )
      .trim();


  if (
    !/^\d{15,25}$/.test(id)
  ) {

    return interaction.reply({

      content:
        '❌ Informe um ID válido do Discord.',

      ephemeral: true

    });

  }


  const ownerId =
    getTicketOwnerId(
      interaction.channel
    );


  if (
    !ownerId
  ) {

    return interaction.reply({

      content:
        '❌ Este canal não é um ticket.',

      ephemeral: true

    });

  }


  if (
    acao === 'retirar' &&
    id === ownerId
  ) {

    return interaction.reply({

      content:
        '❌ O dono original do ticket não pode ser retirado.',

      ephemeral: true

    });

  }


  const member =
    await interaction.guild.members
      .fetch(id)
      .catch(
        () => null
      );


  if (
    !member
  ) {

    return interaction.reply({

      content:
        '❌ Não encontrei esse player no servidor.',

      ephemeral: true

    });

  }


  try {

    if (
      acao === 'adicionar'
    ) {

      await interaction.channel.permissionOverwrites.edit(

        member.id,

        {

          ViewChannel:
            true,

          SendMessages:
            true,

          ReadMessageHistory:
            true,

          AttachFiles:
            true

        }

      );


      await interaction.reply({

        content:
          `✅ ${member} foi **adicionado** ao ticket.`,

        ephemeral: false

      });


      await sendTicketLog(

        interaction.guild,

        [
          '➕ **PLAYER ADICIONADO AO TICKET**',
          '',
          `👤 Player: <@${member.id}>`,
          `🛡️ Responsável: <@${interaction.user.id}>`,
          `🎫 Canal: ${interaction.channel}`
        ].join('\n')

      );

    } else {

      await interaction.channel.permissionOverwrites
        .delete(
          member.id
        );


      await interaction.reply({

        content:
          `✅ ${member} foi **retirado** do ticket.`,

        ephemeral: false

      });


      await sendTicketLog(

        interaction.guild,

        [
          '➖ **PLAYER RETIRADO DO TICKET**',
          '',
          `👤 Player: <@${member.id}>`,
          `🛡️ Responsável: <@${interaction.user.id}>`,
          `🎫 Canal: ${interaction.channel}`
        ].join('\n')

      );

    }

  } catch (error) {

    console.error(
      '❌ Erro ao gerenciar participante:',
      error
    );


    return interaction.reply({

      content:
        '❌ Não foi possível alterar o acesso deste player.',

      ephemeral: true

    });

  }

}

/* =========================================================
   COMANDOS
========================================================= */

function commandBuilders()

  return

/* =====================================================
   PAINEL
===================================================== */

new SlashCommandBuilder()
  .setName('painel')
  .setDescription('🏴 Gerencia os painéis da Pavuna')
  .setDMPermission(false)

  .addSubcommand(sub =>
    sub
      .setName('edital')
      .setDescription('📜 Envia o painel de recrutamento')
  )

  .addSubcommand(sub =>
    sub
      .setName('registrar')
      .setDescription('📝 Envia o painel de registro')
  )

  .addSubcommand(sub =>
    sub
      .setName('ponto')
      .setDescription('🕐 Envia o painel de bate-ponto')
  )

  .addSubcommand(sub =>
    sub
      .setName('promocao')
      .setDescription('📈 Promove um membro')
      // suas opções atuais aqui
  )

  .addSubcommand(sub =>
    sub
      .setName('rebaixamento')
      .setDescription('📉 Rebaixa um membro')
      // suas opções atuais aqui
  )

  // 👇 ADICIONE ISSO
  .addSubcommand(sub =>
    sub
      .setName('ticket')
      .setDescription('🎫 Envia o painel de tickets')
  )

  .toJSON(),


/* =========================================================
   READY
========================================================= */

client.once(
  'ready',
  async () => {

    console.log(
      '=========================================='
    );

    console.log(
      `✅ Pavuna conectado como ${client.user.tag}`
    );

    console.log(
      `🕐 Bate-ponto carregado`
    );

    console.log(
      `🎙️ Calls autorizadas: ${CONFIG.pontoVoiceChannels.length}`
    );

    console.log(
      '👑 Cargos administrativos:'
    );

    CONFIG.adminRoles.forEach(
      roleId =>
        console.log(
          `   • ${roleId}`
        )
    );

    console.log(
      '=========================================='
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


/* =========================================================
   INTERAÇÕES
========================================================= */

client.on(
  'interactionCreate',
  async interaction => {

    try {

      /* ===================================================
         SLASH COMMANDS
      =================================================== */

      if (
        interaction.isChatInputCommand()
      ) {

        /* =================================================
           PAINEL
        ================================================= */

        if (
          interaction.commandName ===
          'painel'
        ) {

          if (
            !await requireAdmin(
              interaction
            )
          )
            return;

          const tipo =
            interaction.options
              .getSubcommand();

          /* -----------------------------------------------
             EDITAL
          ----------------------------------------------- */

          if (
            tipo ===
            'edital'
          ) {

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
                '✅ **Painel de edital enviado!**',

              ephemeral: true

            });
          }


          /* -----------------------------------------------
             REGISTRO
          ----------------------------------------------- */

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
                '✅ **Painel de registro enviado!**',

              ephemeral: true

            });
          }


          /* -----------------------------------------------
             PONTO
          ----------------------------------------------- */

          if (
            tipo ===
            'ponto'
          ) {

            await interaction.channel.send({

              embeds: [
                pontoPainelEmbed()
              ],

              components: [
                pontoPainelRow()
              ]

            });

            return interaction.reply({

              content:
                '🕐 **Painel de bate-ponto enviado!**',

              ephemeral: true

            });
          }


          /* -----------------------------------------------
             PROMOÇÃO
          ----------------------------------------------- */

          if (
            tipo ===
            'promocao'
          ) {

            const target =
              interaction.options
                .getMember(
                  'membro'
                );

            const oldRole =
              interaction.options
                .getRole(
                  'cargo_antigo'
                );

            const newRole =
              interaction.options
                .getRole(
                  'novo_cargo'
                );

            const motivo =
              interaction.options
                .getString(
                  'motivo'
                );

            return executarAlteracaoCargo(

              interaction,

              'Promoção',

              target,

              oldRole,

              newRole,

              motivo

            );
          }


          /* -----------------------------------------------
             REBAIXAMENTO
          ----------------------------------------------- */

          if (
            tipo ===
            'rebaixamento'
          ) {

            const target =
              interaction.options
                .getMember(
                  'membro'
                );

            const oldRole =
              interaction.options
                .getRole(
                  'cargo_antigo'
                );

            const newRole =
              interaction.options
                .getRole(
                  'novo_cargo'
                );

            const motivo =
              interaction.options
                .getString(
                  'motivo'
                );

            return executarAlteracaoCargo(

              interaction,

              'Rebaixamento',

              target,

              oldRole,

              newRole,

              motivo

            );
          }
        }


        /* =================================================
           EXONERAÇÃO
        ================================================= */

        if (
          interaction.commandName ===
          'exoneracao'
        ) {

          if (
            !await requireAdmin(
              interaction
            )
          )
            return;

          const target =
            interaction.options
              .getMember(
                'membro'
              );

          const motivo =
            interaction.options
              .getString(
                'motivo'
              );

          if (!target) {

            return interaction.reply({
              content:
                '❌ Não encontrei esse membro.',
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

          if (
            target.id ===
            interaction.guild.ownerId
          ) {

            return interaction.reply({
              content:
                '❌ O dono do servidor não pode ser exonerado pelo bot.',
              ephemeral: true
            });
          }

          const botMember =
            interaction.guild.members.me;

          if (!botMember) {

            return interaction.reply({
              content:
                '❌ Não consegui verificar a hierarquia.',
              ephemeral: true
            });
          }

          const removed = [];

          for (
            const role
            of target.roles.cache.values()
          ) {

            if (
              role.id ===
              interaction.guild.id
            )
              continue;

            if (
              CONFIG.exoneracaoKeepRoles
                .includes(
                  role.id
                )
            )
              continue;

            if (
              role.managed
            )
              continue;

            if (
              role.position >=
              botMember.roles.highest.position
            )
              continue;

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
                  '📤・EXONERAÇÃO REGISTRADA'
                )

                .setDescription(

                  [
                    `👤 **Membro:** ${target}`,
                    `🛡️ **Responsável:** ${interaction.member}`,
                    '',
                    `📝 **Motivo:** ${motivo}`,
                    '',
                    `📋 **Cargos removidos:** ${removed.length}`
                  ].join('\n')

                )

                .setFooter({
                  text:
                    '🏴 Pavuna • Administração'
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


        /* =================================================
           PROMOÇÃO
        ================================================= */

        if (
          interaction.commandName ===
          'promocao'
        ) {

          if (
            !await requireAdmin(
              interaction
            )
          )
            return;

          const target =
            interaction.options
              .getMember(
                'membro'
              );

          const oldRole =
            interaction.options
              .getRole(
                'cargo_antigo'
              );

          const newRole =
            interaction.options
              .getRole(
                'novo_cargo'
              );

          const motivo =
            interaction.options
              .getString(
                'motivo'
              );

          return executarAlteracaoCargo(

            interaction,

            'Promoção',

            target,

            oldRole,

            newRole,

            motivo

          );
        }


        /* =================================================
           REBAIXAMENTO
        ================================================= */

        if (
          interaction.commandName ===
          'rebaixamento'
        ) {

          if (
            !await requireAdmin(
              interaction
            )
          )
            return;

          const target =
            interaction.options
              .getMember(
                'membro'
              );

          const oldRole =
            interaction.options
              .getRole(
                'cargo_antigo'
              );

          const newRole =
            interaction.options
              .getRole(
                'novo_cargo'
              );

          const motivo =
            interaction.options
              .getString(
                'motivo'
              );

          return executarAlteracaoCargo(

            interaction,

            'Rebaixamento',

            target,

            oldRole,

            newRole,

            motivo

          );
        }


        /* =================================================
           BLACKLIST
        ================================================= */

        if (
          interaction.commandName ===
          'blacklist'
        ) {

          if (
            !await requireAdmin(
              interaction
            )
          )
            return;

          const user =
            interaction.options
              .getUser(
                'membro'
              );

          const existingBan =
            await interaction.guild.bans
              .fetch(
                user.id
              )
              .catch(
                () => null
              );

          if (
            existingBan
          ) {

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
                      '♻️・BLACKLIST REMOVIDA'
                    )

                    .setDescription(
                      `✅ **${user.tag}** foi removido da blacklist.`
                    )

                    .setTimestamp()

                ]

              });

              await sendLog(

                interaction.guild,

                [
                  '♻️ **BLACKLIST REMOVIDA**',
                  '',
                  `👤 Usuário: ${user.tag}`,
                  `🆔 ID: ${user.id}`,
                  `🛡️ Responsável: <@${interaction.user.id}>`
                ].join('\n')

              );

            } catch (error) {

              console.error(
                error
              );

              return interaction.reply({
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
                      '⛔・BLACKLIST APLICADA'
                    )

                    .setDescription(
                      `🚫 **${user.tag}** foi colocado na blacklist.`
                    )

                    .setTimestamp()

                ]

              });

              await sendLog(

                interaction.guild,

                [
                  '⛔ **BLACKLIST**',
                  '',
                  `👤 Usuário: ${user.tag}`,
                  `🆔 ID: ${user.id}`,
                  `🛡️ Responsável: <@${interaction.user.id}>`
                ].join('\n')

              );

            } catch (error) {

              console.error(
                error
              );

              return interaction.reply({
                content:
                  '❌ Não foi possível banir o usuário. Verifique a permissão **Banir Membros**.',
                ephemeral: true
              });
            }
          }

          return;
        }

        return;
      }


      /* ===================================================
         MODAL
      =================================================== */

      if (
        interaction.isModalSubmit()
      ) {

        if (
          interaction.customId ===
          'modal_registro'
        ) {

          return realizarRegistro(
            interaction
          );
        }
      }


      /* ===================================================
         BOTÕES
      =================================================== */

      if (
        interaction.isButton()
      ) {

        /* =================================================
           REGISTRO
        ================================================= */

        if (
          interaction.customId ===
          'abrir_registro'
        ) {

          return abrirModalRegistro(
            interaction
          );
        }


        /* =================================================
           EDITAL
        ================================================= */

        if (
          interaction.customId ===
          'fazer_edital'
        ) {

          return createEditalChannel(
            interaction
          );
        }


        /* =================================================
           PONTO
        ================================================= */

        if (
          interaction.customId ===
          'ponto_comecar'
        ) {

          return iniciarPonto(
            interaction
          );
        }

        if (
          interaction.customId ===
          'ponto_fechar'
        ) {

          return fecharPonto(
            interaction
          );
        }

        if (
          interaction.customId ===
          'ponto_ranking'
        ) {

          return mostrarRanking(
            interaction
          );
        }


        /* =================================================
           SESSÃO DO EDITAL
        ================================================= */

        const session =
          sessions.get(
            interaction.user.id
          );


        /* =================================================
           FECHAR EDITAL
        ================================================= */

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
            ) ||
            hasAnyRole(
              interaction.member,
              CONFIG.adminRoles
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
              session.candidateId
            );
          }

          await interaction.reply({

            content:
              '🔒 **Edital encerrado.** O canal será excluído em 5 segundos.'

          });

          return deleteAfter(
            interaction.channel,
            'Edital fechado manualmente'
          );
        }


        /* =================================================
           INICIAR EDITAL
        ================================================= */

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
            session.candidateId !==
            interaction.user.id
          ) {

            return interaction.reply({
              content:
                '❌ Somente o candidato pode iniciar este edital.',
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
      }

    } catch (error) {

      console.error(
        '❌ Erro na interação:',
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


/* =========================================================
   ERROS
========================================================= */

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


/* =========================================================
   LOGIN
========================================================= */

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
