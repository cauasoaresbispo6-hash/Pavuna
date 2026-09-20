from pathlib import Path

code = r'''/*
============================================================
 PAVUNA BOT — CENTRAL OPERACIONAL
 Versão Premium / Discord.js 14
============================================================

 RECURSOS:
 - Central de painéis
 - Recrutamento com 11 etapas, tempo e gabarito
 - Registro Nick + ID
 - Bate-ponto com meta semanal e ranking
 - Tickets por categoria
 - Reivindicação de ticket
 - Adição/remoção de participantes
 - Promoção / Rebaixamento / Exoneração / Blacklist
 - Logs
 - Permissões
 - Persistência local
 - Tratamento de erros
 - Interface padronizada

 VARIÁVEIS RAILWAY:
 TOKEN=seu_token
 GUILD_ID=id_do_servidor

 IMPORTANTE:
 Nunca coloque o TOKEN diretamente neste arquivo.
============================================================
*/

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  AttachmentBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

/* =========================================================
   01 — AMBIENTE
========================================================= */

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID || null;

if (!TOKEN) {
  console.error('❌ A variável TOKEN não foi encontrada.');
  console.error('➡️ Railway > Variables > TOKEN');
  process.exit(1);
}

/* =========================================================
   02 — CONFIGURAÇÃO PRINCIPAL
========================================================= */

const CONFIG = {
  brand: {
    name: 'PAVUNA',
    subtitle: 'CENTRAL OPERACIONAL',
    color: 0x15171c,
    success: 0x2ecc71,
    warning: 0xf1c40f,
    danger: 0xe74c3c,
    info: 0x3498db,
    neutral: 0x5865f2
  },

  roles: {
    admins: [
      '1550615266046644259',
      '1550615266046644258',
      '1550615266046644257'
    ],

    editalAccess: [
      '1550615266030002192',
      '1550615266030002193'
    ],

    approved: [
      '1550615266004574308',
      '1550615265954373758',
      '1550678827603329044',
      '1550893217027989654'
    ],

    ticketStaff: [
      '1550615266030002188',
      '1550615266046644257',
      '1550615266046644259'
    ],

    preserveOnExoneration: [
      '1550615265954373757',
      '1550615265954373756'
    ]
  },

  voiceChannels: [
    '1550686696671281252',
    '1550687590657564672',
    '1550615268969938970',
    '1550615269376790579',
    '1550615269376790580',
    '1550615269376790581',
    '1550615268969938973',
    '1550615269376790578',
    '1550615268969938971',
    '1550615268969938972'
  ],

  images: {
    edital:
      'https://media.discordapp.net/attachments/1550653825659183144/1550714361973051474/Captura_de_tela_2026-09-19_004348.png?ex=6aaf56ca&is=6aae054&hm=fd4f3deb9bbe0a581417d2504740aecfd43e72995527cc5bfb8804ec21f06eec&=&format=webp&quality=lossless',

    registro:
      'https://media.discordapp.net/attachments/1494717315743350836/1550919367339024384/648a4579-c535-4be5-b1ce-796cc37e6378.png?ex=6ab015b7&is=6aaec437&hm=9f3aaca3870b2a7156ada9d41fabb1613431204ea54008448c2199eb68baa925&=&format=webp&quality=lossless&width=768&height=317',

    ticket:
      'https://media.discordapp.net/attachments/1551129943394492526/1551271126146093157/image.png?ex=6ab15d51&is=6ab00bd1&hm=dfb73fb6da0e56285dd3794dbefb774983871379aee0d5439575bff275610549&=&format=webp&quality=lossless'
  },

  ticket: {
    categoryId: process.env.TICKET_CATEGORY_ID || null,
    logChannelId: process.env.TICKET_LOG_CHANNEL_ID || null
  },

  logs: {
    channelId: process.env.LOG_CHANNEL_ID || null
  },

  point: {
    weeklyGoal: 7 * 60 * 60 * 1000
  },

  recruitment: {
    minimumLinesQuestion: 4
  }
};

/* =========================================================
   03 — CLIENT
========================================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.User
  ]
});

/* =========================================================
   04 — ARMAZENAMENTO
========================================================= */

const DATA_DIR = path.join(__dirname, 'data');
const POINTS_FILE = path.join(DATA_DIR, 'pontos.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const HISTORY_FILE = path.join(DATA_DIR, 'historico.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaults = [
    [POINTS_FILE, {}],
    [TICKETS_FILE, {}],
    [HISTORY_FILE, []]
  ];

  for (const [file, fallback] of defaults) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    }
  }
}

ensureDataDirectory();

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar ${file}:`, error);
    return false;
  }
}

let pontos = readJson(POINTS_FILE, {});
let tickets = readJson(TICKETS_FILE, {});
let historico = readJson(HISTORY_FILE, []);

const pontosAtivos = new Map();
const recrutamentosAtivos = new Map();

/* =========================================================
   05 — QUESTÕES DO EDITAL
========================================================= */

const RECRUITMENT_QUESTIONS = [
  {
    id: 1,
    title: 'Nome completo',
    time: 3 * 60 * 1000,
    type: 'text'
  },

  {
    id: 2,
    title: 'Nick',
    time: 3 * 60 * 1000,
    type: 'text'
  },

  {
    id: 3,
    title: 'ID',
    time: 3 * 60 * 1000,
    type: 'text',
    numeric: true
  },

  {
    id: 4,
    title: 'Por que quer entrar para nossa Facção? Mínimo 2 linhas.',
    time: 5 * 60 * 1000,
    type: 'text'
  },

  {
    id: 5,
    title: 'Já participou de alguma fac/corp? Se sim, qual e quanto tempo ficou nela.',
    time: 5 * 60 * 1000,
    type: 'text'
  },

  {
    id: 6,
    title: 'O que é RDM?',
    time: 5 * 60 * 1000,
    type: 'choice',
    choices: [
      ['A', 'Matar sem motivo'],
      ['B', 'Atropelar sem motivo'],
      ['C', 'Usar informação de fora do jogo para o jogo'],
      ['D', 'Fazer coisas impossíveis humanamente']
    ],
    answer: 'A'
  },

  {
    id: 7,
    title: 'O que é VDM?',
    time: 5 * 60 * 1000,
    type: 'choice',
    choices: [
      ['A', 'Matar sem motivo'],
      ['B', 'Usar informação de fora para jogo'],
      ['C', 'Atropelar alguém até a morte'],
      ['D', 'Fazer coisas impossíveis humanamente']
    ],
    answer: 'C'
  },

  {
    id: 8,
    title: 'O que é CL?',
    time: 5 * 60 * 1000,
    type: 'choice',
    choices: [
      ['A', 'Quitar em ação'],
      ['B', 'Usar informação de fora'],
      ['C', 'Atropelar até morte'],
      ['D', 'Fazer coisas impossíveis humanamente']
    ],
    answer: 'A'
  },

  {
    id: 9,
    title: 'O que é MG?',
    time: 5 * 60 * 1000,
    type: 'choice',
    choices: [
      ['A', 'Matar sem motivo'],
      ['B', 'Fazer coisas impossíveis'],
      ['C', 'Atropelar até morte'],
      ['D', 'Usar informação de fora para jogo']
    ],
    answer: 'D'
  },

  {
    id: 10,
    title: 'O que é PG?',
    time: 5 * 60 * 1000,
    type: 'choice',
    choices: [
      ['A', 'Matar sem motivo'],
      ['B', 'Fazer coisas impossíveis'],
      ['C', 'Usar informação de fora para jogo'],
      ['D', 'Atropelar até morte']
    ],
    answer: 'B'
  },

  {
    id: 11,
    title: 'O que pode agregar para nossa facção?',
    time: 5 * 60 * 1000,
    type: 'text'
  }
];

/* =========================================================
   06 — FORMATADORES
========================================================= */

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    `${String(hours).padStart(2, '0')}h`,
    `${String(minutes).padStart(2, '0')}m`,
    `${String(seconds).padStart(2, '0')}s`
  ].join(' ');
}

function formatShortDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function discordTimestamp(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function discordRelative(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

function cleanChannelName(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'atendimento';
}

function truncate(text, max = 1000) {
  const value = String(text ?? '');

  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 3)}...`;
}

function isNumeric(value) {
  return /^\d+$/.test(String(value).trim());
}

function normalizeAnswer(value) {
  return String(value || '').trim().toUpperCase();
}

/* =========================================================
   07 — DATAS / SEMANA
========================================================= */

function currentWeekKey() {
  const now = new Date();
  const day = now.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);

  return now.toISOString().slice(0, 10);
}

function ensurePointUser(userId) {
  const week = currentWeekKey();

  if (!pontos[userId]) {
    pontos[userId] = {
      week,
      weekly: 0,
      total: 0,
      sessions: 0,
      lastStart: null,
      lastEnd: null
    };
  }

  if (pontos[userId].week !== week) {
    pontos[userId].week = week;
    pontos[userId].weekly = 0;
    pontos[userId].sessions = 0;
  }

  return pontos[userId];
}

/* =========================================================
   08 — EMBEDS PREMIUM
========================================================= */

function baseEmbed(title, description, color = CONFIG.brand.color) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: `${CONFIG.brand.name} • ${CONFIG.brand.subtitle}`
    })
    .setTimestamp();
}

function successEmbed(title, description) {
  return baseEmbed(
    `✓ ${title}`,
    description,
    CONFIG.brand.success
  );
}

function errorEmbed(title, description) {
  return baseEmbed(
    `× ${title}`,
    description,
    CONFIG.brand.danger
  );
}

function warningEmbed(title, description) {
  return baseEmbed(
    `! ${title}`,
    description,
    CONFIG.brand.warning
  );
}

function infoEmbed(title, description) {
  return baseEmbed(
    `• ${title}`,
    description,
    CONFIG.brand.info
  );
}

function premiumHeader() {
  return [
    `**${CONFIG.brand.name}**`,
    `*${CONFIG.brand.subtitle}*`
  ].join('\n');
}

/* =========================================================
   09 — PERMISSÕES
========================================================= */

function hasAnyRole(member, roleIds) {
  if (!member?.roles?.cache) return false;

  return roleIds.some(roleId =>
    member.roles.cache.has(roleId)
  );
}

function isAdmin(member) {
  return hasAnyRole(member, CONFIG.roles.admins);
}

function isTicketStaff(member) {
  return hasAnyRole(member, CONFIG.roles.ticketStaff);
}

function canManageTickets(member) {
  return isTicketStaff(member);
}

/* =========================================================
   10 — LOGS
========================================================= */

async function sendLog(guild, embed) {
  if (!guild) return;

  const channelId =
    CONFIG.logs.channelId ||
    CONFIG.ticket.logChannelId;

  if (!channelId) return;

  try {
    const channel = await guild.channels.fetch(channelId);

    if (!channel?.isTextBased()) return;

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('⚠️ Não foi possível enviar log:', error.message);
  }
}

async function logAction(guild, title, description, color) {
  const embed = baseEmbed(
    `LOG • ${title}`,
    description,
    color
  );

  await sendLog(guild, embed);
}

/* =========================================================
   11 — PAINEL CENTRAL
========================================================= */

function centralPanelEmbed() {
  return baseEmbed(
    'PAVUNA | CENTRAL OPERACIONAL',
    [
      premiumHeader(),
      '',
      '**Bem-vindo à Central Oficial da Pavuna.**',
      '',
      'Este painel concentra os principais serviços operacionais do servidor.',
      '',
      '**ACESSOS DISPONÍVEIS**',
      '',
      '📋 **RECRUTAMENTO**',
      'Processo oficial para novos integrantes.',
      '',
      '📝 **REGISTRO**',
      'Atualização de Nick e ID.',
      '',
      '⏱️ **JORNADA**',
      'Controle e acompanhamento do ponto.',
      '',
      '🎫 **ATENDIMENTO**',
      'Central para solicitações e suporte.',
      '',
      '> **Selecione uma das opções abaixo para continuar.**'
    ].join('\n')
  );
}

function centralPanelRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('central_edital')
        .setLabel('RECRUTAMENTO')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('central_registro')
        .setLabel('REGISTRO')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('central_ponto')
        .setLabel('JORNADA')
        .setEmoji('⏱️')
        .setStyle(ButtonStyle.Secondary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('central_ticket')
        .setLabel('ATENDIMENTO')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('central_admin')
        .setLabel('ADMINISTRAÇÃO')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

/* =========================================================
   12 — PAINEL EDITAL
========================================================= */

function recruitmentPanelEmbed() {
  return baseEmbed(
    'PAVUNA | RECRUTAMENTO OFICIAL',
    [
      '**PROCESSO SELETIVO**',
      '',
      'Interessado em fazer parte da Pavuna?',
      '',
      'O recrutamento possui etapas individuais e perguntas com tempo determinado. Leia atentamente cada questão antes de responder.',
      '',
      '**DIRETRIZES**',
      '• Responda todas as etapas.',
      '• Não abandone o processo durante uma pergunta.',
      '• Mantenha respostas claras e coerentes.',
      '• Respeite o limite de tempo.',
      '',
      '**ESTRUTURA**',
      `• ${RECRUITMENT_QUESTIONS.length} perguntas`,
      '• Perguntas abertas e objetivas',
      '• Avaliação automática das questões objetivas',
      '',
      '> **Ao iniciar, o cronômetro da primeira etapa será iniciado.**'
    ].join('\n')
  )
    .setImage(CONFIG.images.edital)
    .addFields({
      name: 'STATUS',
      value: '🟢 Recrutamento disponível',
      inline: true
    }, {
      name: 'TIPO',
      value: '📋 Processo individual',
      inline: true
    });
}

function recruitmentPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('recruitment_start')
      .setLabel('INICIAR RECRUTAMENTO')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary)
  );
}

/* =========================================================
   13 — RECRUTAMENTO: MODAIS
========================================================= */

function recruitmentModal(question, sessionId) {
  const modal = new ModalBuilder()
    .setCustomId(`recruitment_answer:${sessionId}:${question.id}`)
    .setTitle(`Etapa ${question.id} • Pavuna`);

  const input = new TextInputBuilder()
    .setCustomId('answer')
    .setLabel(question.title.slice(0, 45))
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000)
    .setPlaceholder(
      question.type === 'choice'
        ? 'Digite A, B, C ou D'
        : 'Digite sua resposta...'
    );

  if (question.id === 4) {
    input.setMinLength(10);
  }

  if (question.numeric) {
    input.setStyle(TextInputStyle.Short);
    input.setPlaceholder('Digite apenas números');
    input.setMaxLength(12);
  }

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return modal;
}

/* =========================================================
   14 — RECRUTAMENTO: EMBED DA PERGUNTA
========================================================= */

function recruitmentQuestionEmbed(question, session) {
  const startedAt = session.questionStartedAt;
  const endsAt = startedAt + question.time;

  let description = [
    `**ETAPA ${question.id} DE ${RECRUITMENT_QUESTIONS.length}**`,
    '',
    `**${question.title}**`,
    ''
  ];

  if (question.type === 'choice') {
    description.push(
      ...question.choices.map(
        ([letter, text]) => `**${letter})** ${text}`
      ),
      ''
    );
  }

  description.push(
    `⏱️ **Início:** ${discordTimestamp(new Date(startedAt))}`,
    `⏳ **Limite:** ${formatShortDuration(question.time)}`,
    `🔚 **Término:** ${discordTimestamp(new Date(endsAt))}`,
    '',
    '> Envie sua resposta através do botão abaixo.'
  );

  return baseEmbed(
    `📋 RECRUTAMENTO • ETAPA ${question.id}`,
    description.join('\n')
  );
}

function recruitmentQuestionRow(question) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`recruitment_respond:${question.id}`)
      .setLabel('RESPONDER ETAPA')
      .setEmoji('✍️')
      .setStyle(ButtonStyle.Secondary)
  );
}

/* =========================================================
   15 — RECRUTAMENTO: SESSÃO
========================================================= */

function createRecruitmentSession(userId, channelId) {
  const sessionId =
    `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const session = {
    id: sessionId,
    userId,
    channelId,
    currentIndex: 0,
    answers: {},
    startedAt: Date.now(),
    questionStartedAt: Date.now(),
    completed: false,
    score: 0
  };

  recrutamentosAtivos.set(userId, session);

  return session;
}

function getRecruitmentSession(userId) {
  return recrutamentosAtivos.get(userId) || null;
}

function currentRecruitmentQuestion(session) {
  return RECRUITMENT_QUESTIONS[session.currentIndex];
}

function recruitmentTimeExpired(session, question) {
  return Date.now() > session.questionStartedAt + question.time;
}

/* =========================================================
   16 — RECRUTAMENTO: AVALIAÇÃO
========================================================= */

function validateRecruitmentAnswer(question, answer) {
  const value = String(answer || '').trim();

  if (!value) {
    return {
      valid: false,
      reason: 'Resposta vazia.'
    };
  }

  if (question.numeric && !isNumeric(value)) {
    return {
      valid: false,
      reason: 'Esta etapa aceita apenas números.'
    };
  }

  if (question.id === 4) {
    const lines = value.split(/\r?\n/).filter(Boolean);

    if (lines.length < 2 && value.length < 30) {
      return {
        valid: false,
        reason: 'A resposta deve conter pelo menos duas linhas ou desenvolvimento equivalente.'
      };
    }
  }

  return {
    valid: true
  };
}

function scoreRecruitment(session) {
  let correct = 0;

  for (const question of RECRUITMENT_QUESTIONS) {
    if (question.type !== 'choice') continue;

    const answer = normalizeAnswer(
      session.answers[question.id]
    );

    if (answer === question.answer) {
      correct++;
    }
  }

  session.score = correct;

  return correct;
}

/* =========================================================
   17 — RECRUTAMENTO: RESULTADO
========================================================= */

function recruitmentResultEmbed(session, approved) {
  const score = scoreRecruitment(session);

  if (approved) {
    return successEmbed(
      'RECRUTAMENTO APROVADO',
      [
        '**Parabéns. Seu processo foi concluído com aprovação.**',
        '',
        `**Resultado objetivo:** ${score}/5`,
        `**Candidato:** <@${session.userId}>`,
        '',
        'Sua entrada foi registrada e os cargos de aprovação serão aplicados.',
        '',
        '> Aguarde as próximas orientações da equipe.'
      ].join('\n')
    );
  }

  return errorEmbed(
    'RECRUTAMENTO NÃO APROVADO',
    [
      '**Seu processo foi encerrado sem aprovação.**',
      '',
      `**Resultado objetivo:** ${score}/5`,
      `**Candidato:** <@${session.userId}>`,
      '',
      'Estude as regras do servidor e retorne futuramente para realizar um novo processo, conforme as regras da Pavuna.'
    ].join('\n')
  );
}

/* =========================================================
   18 — RECRUTAMENTO: CRIAÇÃO DO CANAL
========================================================= */

async function createRecruitmentChannel(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  const existing = guild.channels.cache.find(channel =>
    channel.topic?.includes(`recruitmentOwner:${user.id}`)
  );

  if (existing) {
    return {
      error: `Você já possui um processo aberto em ${existing}.`
    };
  }

  const overwrites = [
    {
      id: guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },

    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
      ]
    },

    {
      id: client.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages
      ]
    }
  ];

  for (const roleId of CONFIG.roles.editalAccess) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    });
  }

  const channel = await guild.channels.create({
    name: `recrutamento-${cleanChannelName(user.username)}`,
    type: ChannelType.GuildText,
    topic: `recruitmentOwner:${user.id}|status:active`,
    permissionOverwrites: overwrites
  });

  return {
    channel
  };
}

/* =========================================================
   19 — RECRUTAMENTO: INÍCIO
========================================================= */

async function startRecruitment(interaction) {
  if (recrutamentosAtivos.has(interaction.user.id)) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'PROCESSO EM ANDAMENTO',
          'Você já possui um recrutamento ativo.'
        )
      ],
      ephemeral: true
    });
  }

  const result = await createRecruitmentChannel(interaction);

  if (result.error) {
    return interaction.reply({
      embeds: [warningEmbed('PROCESSO EXISTENTE', result.error)],
      ephemeral: true
    });
  }

  const channel = result.channel;

  const session = createRecruitmentSession(
    interaction.user.id,
    channel.id
  );

  const question = currentRecruitmentQuestion(session);

  await channel.send({
    content: `${interaction.user}`,
    embeds: [
      infoEmbed(
        'PROCESSO INICIADO',
        [
          '**Bem-vindo ao recrutamento da Pavuna.**',
          '',
          'Leia cada etapa com atenção.',
          'Cada pergunta possui um tempo específico.',
          '',
          `**Candidato:** ${interaction.user}`,
          `**Início:** ${discordTimestamp()}`,
          '',
          '> O processo será encerrado automaticamente caso o tempo de uma etapa seja excedido.'
        ].join('\n')
      ),
      recruitmentQuestionEmbed(question, session)
    ],
    components: [
      recruitmentQuestionRow(question)
    ]
  });

  await interaction.reply({
    embeds: [
      successEmbed(
        'RECRUTAMENTO ABERTO',
        `Seu processo foi criado em ${channel}.`
      )
    ],
    ephemeral: true
  });

  scheduleRecruitmentTimeout(session);
}

/* =========================================================
   20 — RECRUTAMENTO: TIMEOUT
========================================================= */

function scheduleRecruitmentTimeout(session) {
  const question = currentRecruitmentQuestion(session);

  if (!question) return;

  const remaining =
    question.time -
    (Date.now() - session.questionStartedAt);

  if (remaining <= 0) {
    expireRecruitment(session);
    return;
  }

  setTimeout(() => {
    const current = recrutamentosAtivos.get(session.userId);

    if (!current) return;

    if (current.currentIndex !== session.currentIndex) {
      return;
    }

    if (!recruitmentTimeExpired(current, question)) {
      return;
    }

    expireRecruitment(current);
  }, remaining + 1000);
}

async function expireRecruitment(session) {
  if (!recrutamentosAtivos.has(session.userId)) {
    return;
  }

  recrutamentosAtivos.delete(session.userId);

  try {
    const guild = client.guilds.cache.get(
      GUILD_ID || undefined
    );

    const channel = await client.channels.fetch(
      session.channelId
    );

    if (channel?.isTextBased()) {
      await channel.send({
        embeds: [
          errorEmbed(
            'TEMPO ESGOTADO',
            [
              '**O tempo desta etapa foi excedido.**',
              '',
              'O processo foi encerrado automaticamente.',
              '',
              '> Você poderá retornar futuramente para realizar um novo processo, conforme as regras da Pavuna.'
            ].join('\n')
          )
        ]
      });

      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 5000);
    }

    if (guild) {
      await logAction(
        guild,
        'RECRUTAMENTO ENCERRADO',
        `O processo de <@${session.userId}> foi encerrado por tempo excedido.`,
        CONFIG.brand.danger
      );
    }
  } catch (error) {
    console.error('Erro ao expirar recrutamento:', error);
  }
}

/* =========================================================
   21 — RECRUTAMENTO: RESPOSTA
========================================================= */

async function submitRecruitmentAnswer(
  interaction,
  sessionId,
  questionId
) {
  const session =
    recrutamentosAtivos.get(interaction.user.id);

  if (!session || session.id !== sessionId) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'PROCESSO INVÁLIDO',
          'Este processo não está mais ativo.'
        )
      ],
      ephemeral: true
    });
  }

  const question =
    RECRUITMENT_QUESTIONS.find(q => q.id === questionId);

  if (!question) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ETAPA NÃO ENCONTRADA',
          'Não foi possível localizar esta etapa.'
        )
      ],
      ephemeral: true
    });
  }

  if (
    session.currentIndex !==
    RECRUITMENT_QUESTIONS.findIndex(
      q => q.id === questionId
    )
  ) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'ETAPA INCORRETA',
          'Esta não é a etapa atual do seu processo.'
        )
      ],
      ephemeral: true
    });
  }

  if (recruitmentTimeExpired(session, question)) {
    await expireRecruitment(session);

    return interaction.reply({
      embeds: [
        errorEmbed(
          'TEMPO ESGOTADO',
          'O tempo da etapa terminou.'
        )
      ],
      ephemeral: true
    });
  }

  const answer =
    interaction.fields.getTextInputValue('answer').trim();

  const validation =
    validateRecruitmentAnswer(question, answer);

  if (!validation.valid) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'RESPOSTA INVÁLIDA',
          validation.reason
        )
      ],
      ephemeral: true
    });
  }

  session.answers[question.id] = answer;

  session.currentIndex++;

  if (
    session.currentIndex >=
    RECRUITMENT_QUESTIONS.length
  ) {
    session.completed = true;

    const score = scoreRecruitment(session);

    const approved = score >= 4;

    recrutamentosAtivos.delete(interaction.user.id);

    if (approved) {
      for (const roleId of CONFIG.roles.approved) {
        const role = interaction.guild.roles.cache.get(roleId);

        if (role) {
          await interaction.member.roles.add(role).catch(() => {});
        }
      }
    }

    await interaction.reply({
      embeds: [
        recruitmentResultEmbed(
          session,
          approved
        )
      ],
      ephemeral: false
    });

    await logAction(
      interaction.guild,
      approved
        ? 'RECRUTAMENTO APROVADO'
        : 'RECRUTAMENTO REPROVADO',
      [
        `**Candidato:** ${interaction.user}`,
        `**Resultado:** ${score}/5`,
        `**Status:** ${approved ? 'Aprovado' : 'Reprovado'}`
      ].join('\n'),
      approved
        ? CONFIG.brand.success
        : CONFIG.brand.danger
    );

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 8000);

    return;
  }

  session.questionStartedAt = Date.now();

  const nextQuestion =
    currentRecruitmentQuestion(session);

  await interaction.reply({
    embeds: [
      successEmbed(
        'RESPOSTA REGISTRADA',
        [
          `A etapa **${question.id}** foi registrada.`,
          '',
          `Avançando para a etapa **${nextQuestion.id}**.`
        ].join('\n')
      ),
      recruitmentQuestionEmbed(
        nextQuestion,
        session
      )
    ],
    components: [
      recruitmentQuestionRow(nextQuestion)
    ]
  });

  scheduleRecruitmentTimeout(session);
}

/* =========================================================
   22 — REGISTRO
========================================================= */

function registrationEmbed() {
  return baseEmbed(
    'PAVUNA | REGISTRO OPERACIONAL',
    [
      '**IDENTIFICAÇÃO OFICIAL**',
      '',
      'Utilize este sistema para registrar seu Nick e seu ID no servidor.',
      '',
      '**PADRÃO**',
      '`⋆ 𝓟𝓥𝓝 ⋆ NICK ⋆ ID`',
      '',
      '**EXEMPLO**',
      '`⋆ 𝓟𝓥𝓝 ⋆ bispo ⋆ 1325`',
      '',
      '**INFORMAÇÕES**',
      '• Nick será usado no registro.',
      '• ID deve conter somente números.',
      '• O apelido será atualizado automaticamente.',
      '',
      '> **Confira seus dados antes de confirmar.**'
    ].join('\n')
  )
    .setImage(CONFIG.images.registro)
    .addFields({
      name: 'SISTEMA',
      value: '🟢 Operacional',
      inline: true
    }, {
      name: 'FORMATO',
      value: 'Nick + ID',
      inline: true
    });
}

function registrationRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('registration_open')
      .setLabel('REALIZAR REGISTRO')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Secondary)
  );
}

function registrationModal() {
  const modal = new ModalBuilder()
    .setCustomId('registration_modal')
    .setTitle('Registro Oficial • Pavuna');

  const nick = new TextInputBuilder()
    .setCustomId('nick')
    .setLabel('Nick')
    .setPlaceholder('Digite seu nick')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(32);

  const id = new TextInputBuilder()
    .setCustomId('id')
    .setLabel('ID')
    .setPlaceholder('Digite apenas números')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(12);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nick),
    new ActionRowBuilder().addComponents(id)
  );

  return modal;
}

async function processRegistration(interaction) {
  const nick =
    interaction.fields.getTextInputValue('nick').trim();

  const id =
    interaction.fields.getTextInputValue('id').trim();

  if (!nick) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'NICK INVÁLIDO',
          'Informe um Nick válido.'
        )
      ],
      ephemeral: true
    });
  }

  if (!isNumeric(id)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ID INVÁLIDO',
          'O ID deve conter somente números.'
        )
      ],
      ephemeral: true
    });
  }

  const newNickname =
    `⋆ 𝓟𝓥𝓝 ⋆ ${nick} ⋆ ${id}`;

  try {
    await interaction.member.setNickname(
      newNickname
    );

    await logAction(
      interaction.guild,
      'REGISTRO REALIZADO',
      [
        `**Membro:** ${interaction.user}`,
        `**Nick:** ${nick}`,
        `**ID:** ${id}`,
        `**Resultado:** ${newNickname}`
      ].join('\n'),
      CONFIG.brand.success
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          'REGISTRO CONCLUÍDO',
          [
            '**Seu registro foi realizado com sucesso.**',
            '',
            `**Nick:** ${nick}`,
            `**ID:** ${id}`,
            '',
            `**Novo apelido:**\n\`${newNickname}\``,
            '',
            'Seu cadastro foi processado automaticamente.'
          ].join('\n')
        )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erro no registro:', error);

    return interaction.reply({
      embeds: [
        errorEmbed(
          'NÃO FOI POSSÍVEL REGISTRAR',
          [
            'Não consegui alterar seu apelido.',
            '',
            '**Verifique:**',
            '• Permissão Gerenciar Apelidos.',
            '• Hierarquia do cargo do bot.',
            '• Limite de caracteres do apelido.'
          ].join('\n')
        )
      ],
      ephemeral: true
    });
  }
}

/* =========================================================
   23 — PONTO
========================================================= */

function pointPanelEmbed() {
  return baseEmbed(
    'PAVUNA | CONTROLE DE JORNADA',
    [
      '**SISTEMA DE PONTO OPERACIONAL**',
      '',
      'Registre suas atividades de forma organizada e acompanhe seu desempenho semanal.',
      '',
      '**META SEMANAL**',
      '⏱️ **07 horas**',
      '',
      '**FUNCIONAMENTO**',
      '▶️ Inicie sua jornada em um canal autorizado.',
      '⏹️ Encerre quando finalizar.',
      '🏆 Consulte o ranking quando necessário.',
      '',
      '**IMPORTANTE**',
      'O ponto também será encerrado automaticamente caso você deixe um canal de voz autorizado.',
      '',
      '> **Mantenha sua jornada corretamente registrada.**'
    ].join('\n')
  );
}

function pointPanelRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('point_start')
        .setLabel('INICIAR JORNADA')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('point_end')
        .setLabel('ENCERRAR JORNADA')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Secondary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('point_ranking')
        .setLabel('RANKING SEMANAL')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function inAuthorizedVoice(member) {
  return Boolean(
    member.voice.channelId &&
    CONFIG.voiceChannels.includes(
      member.voice.channelId
    )
  );
}

async function startPoint(interaction) {
  const userId = interaction.user.id;

  if (pontosAtivos.has(userId)) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'JORNADA JÁ INICIADA',
          [
            'Você já possui uma jornada ativa.',
            '',
            'Finalize a jornada atual antes de iniciar outra.'
          ].join('\n')
        )
      ],
      ephemeral: true
    });
  }

  if (!inAuthorizedVoice(interaction.member)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'CANAL NÃO AUTORIZADO',
          [
            'Para iniciar o ponto, você precisa estar em um canal de voz autorizado.',
            '',
            'Entre em um canal operacional e tente novamente.'
          ].join('\n')
        )
      ],
      ephemeral: true
    });
  }

  const data = ensurePointUser(userId);

  const now = Date.now();

  data.lastStart = now;

  pontosAtivos.set(userId, {
    start: now,
    channelId: interaction.member.voice.channelId
  });

  writeJson(POINTS_FILE, pontos);

  await logAction(
    interaction.guild,
    'JORNADA INICIADA',
    [
      `**Membro:** ${interaction.user}`,
      `**Início:** ${discordTimestamp(new Date(now))}`,
      `**Canal:** <#${interaction.member.voice.channelId}>`
    ].join('\n'),
    CONFIG.brand.info
  );

  return interaction.reply({
    embeds: [
      successEmbed(
        'JORNADA INICIADA',
        [
          '**Seu ponto foi iniciado com sucesso.**',
          '',
          `**Início:** ${discordTimestamp(new Date(now))}`,
          `**Canal:** <#${interaction.member.voice.channelId}>`,
          '',
          '> Utilize **ENCERRAR JORNADA** ao finalizar suas atividades.'
        ].join('\n')
      )
    ],
    ephemeral: true
  });
}

async function endPoint(interaction, automatic = false) {
  const userId = interaction.user.id;

  const active = pontosAtivos.get(userId);

  if (!active) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'NENHUMA JORNADA ATIVA',
          'Você não possui uma jornada aberta.'
        )
      ],
      ephemeral: true
    });
  }

  const now = Date.now();
  const elapsed = Math.max(0, now - active.start);

  const data = ensurePointUser(userId);

  data.weekly += elapsed;
  data.total += elapsed;
  data.sessions += 1;
  data.lastEnd = now;

  pontosAtivos.delete(userId);

  writeJson(POINTS_FILE, pontos);

  const reached =
    data.weekly >= CONFIG.point.weeklyGoal;

  await logAction(
    interaction.guild,
    automatic
      ? 'JORNADA ENCERRADA AUTOMATICAMENTE'
      : 'JORNADA ENCERRADA',
    [
      `**Membro:** ${interaction.user}`,
      `**Sessão:** ${formatDuration(elapsed)}`,
      `**Semanal:** ${formatDuration(data.weekly)}`,
      `**Total:** ${formatDuration(data.total)}`
    ].join('\n'),
    CONFIG.brand.success
  );

  return interaction.reply({
    embeds: [
      successEmbed(
        automatic
          ? 'JORNADA ENCERRADA AUTOMATICAMENTE'
          : 'JORNADA ENCERRADA',
        [
          '**Registro salvo com sucesso.**',
          '',
          `**Duração da sessão:** ${formatDuration(elapsed)}`,
          `**Total semanal:** ${formatDuration(data.weekly)}`,
          `**Total acumulado:** ${formatDuration(data.total)}`,
          '',
          reached
            ? '✓ **Meta semanal atingida.**'
            : `⏳ **Faltam:** ${formatDuration(CONFIG.point.weeklyGoal - data.weekly)}`
        ].join('\n')
      )
    ],
    ephemeral: !automatic
  });
}

async function pointRanking(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ACESSO RESTRITO',
          'O ranking semanal é de acesso administrativo.'
        )
      ],
      ephemeral: true
    });
  }

  const list = [];

  for (const [userId, data] of Object.entries(pontos)) {
    let weekly = Number(data.weekly || 0);

    const active = pontosAtivos.get(userId);

    if (active) {
      weekly += Date.now() - active.start;
    }

    list.push({
      userId,
      weekly,
      total: Number(data.total || 0)
    });
  }

  list.sort((a, b) =>
    b.weekly - a.weekly
  );

  const top = list.slice(0, 20);

  if (!top.length) {
    return interaction.reply({
      embeds: [
        infoEmbed(
          'RANKING VAZIO',
          'Ainda não existem registros de jornada.'
        )
      ],
      ephemeral: true
    });
  }

  const lines = [];

  for (let i = 0; i < top.length; i++) {
    const item = top[i];

    let display = `<@${item.userId}>`;

    try {
      const member =
        await interaction.guild.members.fetch(
          item.userId
        );

      display = member.displayName;
    } catch {}

    lines.push(
      `**${String(i + 1).padStart(2, '0')}.** ${display} — \`${formatShortDuration(item.weekly)}\``
    );
  }

  return interaction.reply({
    embeds: [
      baseEmbed(
        '🏆 PAVUNA | RANKING SEMANAL',
        [
          '**CLASSIFICAÇÃO OPERACIONAL**',
          '',
          lines.join('\n'),
          '',
          `**Meta semanal:** ${formatShortDuration(CONFIG.point.weeklyGoal)}`,
          `**Semana:** ${currentWeekKey()}`,
          '',
          '> Os tempos ativos são considerados em tempo real.'
        ].join('\n'),
        CONFIG.brand.neutral
      )
    ],
    ephemeral: true
  });
}

/* =========================================================
   24 — TICKETS
========================================================= */

const TICKET_CATEGORIES = {
  encomendas: {
    label: 'Encomendas',
    emoji: '📦',
    description: 'Solicitações relacionadas a encomendas.'
  },

  denuncias: {
    label: 'Denúncias',
    emoji: '🚨',
    description: 'Reporte uma situação para análise.'
  },

  duvidas: {
    label: 'Dúvidas',
    emoji: '❓',
    description: 'Esclareça dúvidas com a equipe.'
  },

  outros: {
    label: 'Outros Assuntos',
    emoji: '📌',
    description: 'Outras solicitações.'
  }
};

function ticketPanelEmbed() {
  return baseEmbed(
    'PAVUNA | CENTRAL DE ATENDIMENTO',
    [
      '**SUPORTE OFICIAL**',
      '',
      'Precisa falar com nossa equipe?',
      'Abra um atendimento selecionando a categoria adequada.',
      '',
      '📦 **ENCOMENDAS**',
      'Assuntos relacionados a encomendas.',
      '',
      '🚨 **DENÚNCIAS**',
      'Situações que precisam de análise.',
      '',
      '❓ **DÚVIDAS**',
      'Perguntas e esclarecimentos.',
      '',
      '📌 **OUTROS ASSUNTOS**',
      'Solicitações que não se encaixam nas categorias anteriores.',
      '',
      '> **Selecione uma categoria abaixo para iniciar.**'
    ].join('\n')
  )
    .setImage(CONFIG.images.ticket)
    .addFields({
      name: 'ATENDIMENTO',
      value: '🟢 Disponível',
      inline: true
    }, {
      name: 'EQUIPE',
      value: '🛡️ Suporte',
      inline: true
    });
}

function ticketPanelRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Selecione o assunto do atendimento...')
      .addOptions(
        Object.entries(TICKET_CATEGORIES)
          .map(([value, category]) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(category.label)
              .setDescription(category.description)
              .setEmoji(category.emoji)
              .setValue(value)
          )
      )
  );
}

function ticketActionRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('REIVINDICAR')
        .setEmoji('🙋')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('FECHAR ATENDIMENTO')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    ),

    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_manage')
        .setPlaceholder('Gerenciar participantes...')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Adicionar um player')
            .setDescription('Adicionar um membro ao atendimento.')
            .setEmoji('➕')
            .setValue('add'),

          new StringSelectMenuOptionBuilder()
            .setLabel('Retirar um player')
            .setDescription('Retirar um membro do atendimento.')
            .setEmoji('➖')
            .setValue('remove')
        )
    )
  ];
}

function ticketExistsForUser(guild, userId) {
  return guild.channels.cache.find(channel =>
    channel.topic?.includes(`ticketOwner:${userId}`)
  );
}

function ticketTopic(userId, category, claimedBy = 'none') {
  return [
    `ticketOwner:${userId}`,
    `category:${category}`,
    `claimedBy:${claimedBy}`
  ].join('|');
}

function parseTicketTopic(topic = '') {
  return {
    owner:
      topic.match(/ticketOwner:(\d+)/)?.[1] || null,

    category:
      topic.match(/category:([^|]+)/)?.[1] || null,

    claimedBy:
      topic.match(/claimedBy:([^|]+)/)?.[1] || null
  };
}

async function createTicket(interaction, categoryKey) {
  const category =
    TICKET_CATEGORIES[categoryKey];

  if (!category) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'CATEGORIA INVÁLIDA',
          'A categoria selecionada não existe.'
        )
      ],
      ephemeral: true
    });
  }

  const existing =
    ticketExistsForUser(
      interaction.guild,
      interaction.user.id
    );

  if (existing) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'ATENDIMENTO JÁ EXISTE',
          `Você já possui um atendimento aberto em ${existing}.`
        )
      ],
      ephemeral: true
    });
  }

  const overwrites = [
    {
      id: interaction.guild.id,
      deny: [
        PermissionsBitField.Flags.ViewChannel
      ]
    },

    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
      ]
    },

    {
      id: client.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages
      ]
    }
  ];

  for (const roleId of CONFIG.roles.ticketStaff) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
      ]
    });
  }

  const channelData = {
    name: `${cleanChannelName(interaction.user.username)}-${categoryKey}`,
    type: ChannelType.GuildText,
    topic: ticketTopic(
      interaction.user.id,
      categoryKey
    ),
    permissionOverwrites: overwrites
  };

  if (CONFIG.ticket.categoryId) {
    channelData.parent =
      CONFIG.ticket.categoryId;
  }

  const channel =
    await interaction.guild.channels.create(
      channelData
    );

  tickets[channel.id] = {
    channelId: channel.id,
    ownerId: interaction.user.id,
    category: categoryKey,
    createdAt: Date.now(),
    claimedBy: null,
    closed: false
  };

  writeJson(TICKETS_FILE, tickets);

  await channel.send({
    content: `${interaction.user}`,
    embeds: [
      baseEmbed(
        `🎫 ATENDIMENTO • ${category.label.toUpperCase()}`,
        [
          `Olá, ${interaction.user}.`,
          '',
          `Seu atendimento foi aberto na categoria **${category.label}**.`,
          '',
          '**DESCREVA SUA SOLICITAÇÃO**',
          'Explique o máximo possível para que a equipe consiga compreender e resolver sua solicitação.',
          '',
          '**ORIENTAÇÕES**',
          '• Aguarde um membro da equipe.',
          '• Evite mensagens desnecessárias.',
          '• Não marque a equipe repetidamente.',
          '',
          '> **Um responsável será acionado para atender você.**'
        ].join('\n')
      )
    ],
    components: ticketActionRows()
  });

  await interaction.reply({
    embeds: [
      successEmbed(
        'ATENDIMENTO ABERTO',
        [
          'Seu atendimento foi criado.',
          '',
          `**Categoria:** ${category.emoji} ${category.label}`,
          `**Canal:** ${channel}`,
          '',
          '> A equipe responsável será acionada.'
        ].join('\n')
      )
    ],
    ephemeral: true
  });

  await logAction(
    interaction.guild,
    'TICKET ABERTO',
    [
      `**Autor:** ${interaction.user}`,
      `**Categoria:** ${category.label}`,
      `**Canal:** ${channel}`
    ].join('\n'),
    CONFIG.brand.info
  );
}

/* =========================================================
   25 — TICKET: REIVINDICAR
========================================================= */

async function claimTicket(interaction) {
  if (!canManageTickets(interaction.member)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ACESSO RESTRITO',
          'Somente membros autorizados da equipe podem reivindicar atendimentos.'
        )
      ],
      ephemeral: true
    });
  }

  const data =
    parseTicketTopic(
      interaction.channel.topic || ''
    );

  if (!data.owner) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'CANAL INVÁLIDO',
          'Este canal não parece ser um ticket da Pavuna.'
        )
      ],
      ephemeral: true
    });
  }

  if (
    data.claimedBy &&
    data.claimedBy !== 'none'
  ) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'ATENDIMENTO JÁ REIVINDICADO',
          `Este atendimento já está sendo tratado por <@${data.claimedBy}>.`
        )
      ],
      ephemeral: true
    });
  }

  const updatedTopic =
    ticketTopic(
      data.owner,
      data.category,
      interaction.user.id
    );

  await interaction.channel.setTopic(
    updatedTopic
  );

  if (tickets[interaction.channel.id]) {
    tickets[interaction.channel.id].claimedBy =
      interaction.user.id;

    writeJson(TICKETS_FILE, tickets);
  }

  await interaction.reply({
    embeds: [
      successEmbed(
        'ATENDIMENTO REIVINDICADO',
        [
          `**Responsável:** ${interaction.user}`,
          '',
          'Este atendimento foi assumido por um membro da equipe.',
          '',
          '> O responsável acompanhará a solicitação a partir de agora.'
        ].join('\n')
      )
    ]
  });

  await logAction(
    interaction.guild,
    'TICKET REIVINDICADO',
    [
      `**Responsável:** ${interaction.user}`,
      `**Canal:** ${interaction.channel}`,
      `**Cliente:** <@${data.owner}>`
    ].join('\n'),
    CONFIG.brand.info
  );
}

/* =========================================================
   26 — TICKET: FECHAR
========================================================= */

async function closeTicket(interaction) {
  const data =
    parseTicketTopic(
      interaction.channel.topic || ''
    );

  if (!data.owner) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'CANAL INVÁLIDO',
          'Este canal não parece ser um ticket.'
        )
      ],
      ephemeral: true
    });
  }

  const authorized =
    interaction.user.id === data.owner ||
    canManageTickets(interaction.member);

  if (!authorized) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'SEM PERMISSÃO',
          'Você não possui autorização para fechar este atendimento.'
        )
      ],
      ephemeral: true
    });
  }

  if (tickets[interaction.channel.id]) {
    tickets[interaction.channel.id].closed = true;
    tickets[interaction.channel.id].closedAt =
      Date.now();
    tickets[interaction.channel.id].closedBy =
      interaction.user.id;

    writeJson(TICKETS_FILE, tickets);
  }

  await interaction.reply({
    embeds: [
      baseEmbed(
        '🔒 ATENDIMENTO ENCERRADO',
        [
          '**Este atendimento será encerrado em instantes.**',
          '',
          `**Encerrado por:** ${interaction.user}`,
          `**Cliente:** <@${data.owner}>`,
          '',
          'Obrigado por utilizar a Central de Atendimento da Pavuna.'
        ].join('\n'),
        CONFIG.brand.danger
      )
    ]
  });

  await logAction(
    interaction.guild,
    'TICKET FECHADO',
    [
      `**Canal:** ${interaction.channel}`,
      `**Cliente:** <@${data.owner}>`,
      `**Responsável pelo fechamento:** ${interaction.user}`
    ].join('\n'),
    CONFIG.brand.danger
  );

  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

/* =========================================================
   27 — TICKET: MODAL PARTICIPANTE
========================================================= */

function participantModal(action) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_participant:${action}`)
    .setTitle(
      action === 'add'
        ? 'Adicionar Participante'
        : 'Retirar Participante'
    );

  const input = new TextInputBuilder()
    .setCustomId('player_id')
    .setLabel('ID do player')
    .setPlaceholder('Informe o ID do Discord')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(25);

  modal.addComponents(
    new ActionRowBuilder().addComponents(input)
  );

  return modal;
}

async function processParticipantChange(
  interaction,
  action
) {
  if (!canManageTickets(interaction.member)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ACESSO RESTRITO',
          'Somente membros autorizados podem gerenciar participantes.'
        )
      ],
      ephemeral: true
    });
  }

  const data =
    parseTicketTopic(
      interaction.channel.topic || ''
    );

  if (!data.owner) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'CANAL INVÁLIDO',
          'Este canal não é reconhecido como ticket.'
        )
      ],
      ephemeral: true
    });
  }

  const playerId =
    interaction.fields
      .getTextInputValue('player_id')
      .trim();

  if (!/^\d{15,25}$/.test(playerId)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ID INVÁLIDO',
          'Informe um ID de usuário Discord válido.'
        )
      ],
      ephemeral: true
    });
  }

  let member;

  try {
    member =
      await interaction.guild.members.fetch(
        playerId
      );
  } catch {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'MEMBRO NÃO ENCONTRADO',
          'Não encontrei esse membro no servidor.'
        )
      ],
      ephemeral: true
    });
  }

  if (
    action === 'remove' &&
    playerId === data.owner
  ) {
    return interaction.reply({
      embeds: [
        warningEmbed(
          'AÇÃO NÃO PERMITIDA',
          'O criador do ticket não pode ser removido do próprio atendimento.'
        )
      ],
      ephemeral: true
    });
  }

  if (action === 'add') {
    await interaction.channel.permissionOverwrites.edit(
      member.id,
      {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true
      }
    );

    await interaction.reply({
      embeds: [
        successEmbed(
          'PARTICIPANTE ADICIONADO',
          [
            `**Membro:** ${member}`,
            '',
            'O membro agora possui acesso a este atendimento.'
          ].join('\n')
        )
      ],
      ephemeral: true
    });
  } else {
    await interaction.channel.permissionOverwrites.delete(
      member.id
    ).catch(() => {});

    await interaction.reply({
      embeds: [
        successEmbed(
          'PARTICIPANTE REMOVIDO',
          [
            `**Membro:** ${member}`,
            '',
            'O acesso individual deste membro foi removido.'
          ].join('\n')
        )
      ],
      ephemeral: true
    });
  }

  await logAction(
    interaction.guild,
    action === 'add'
      ? 'PARTICIPANTE ADICIONADO'
      : 'PARTICIPANTE REMOVIDO',
    [
      `**Ticket:** ${interaction.channel}`,
      `**Membro:** ${member}`,
      `**Responsável:** ${interaction.user}`
    ].join('\n'),
    CONFIG.brand.info
  );
}

/* =========================================================
   28 — ADMINISTRAÇÃO
========================================================= */

function adminPanelEmbed() {
  return baseEmbed(
    'PAVUNA | CENTRAL ADMINISTRATIVA',
    [
      '**GESTÃO DE EFETIVO**',
      '',
      'Área destinada exclusivamente aos membros autorizados.',
      '',
      '**PROCEDIMENTOS DISPONÍVEIS**',
      '',
      '📈 **PROMOÇÃO**',
      'Registro de evolução funcional.',
      '',
      '📉 **REBAIXAMENTO**',
      'Registro de alteração funcional por medida administrativa.',
      '',
      '📄 **EXONERAÇÃO**',
      'Remoção dos cargos operacionais, preservando os cargos definidos.',
      '',
      '⚫ **BLACKLIST**',
      'Controle administrativo de acesso ao servidor.',
      '',
      '> **Todas as ações administrativas devem possuir justificativa adequada.**'
    ].join('\n')
  );
}

function adminPanelRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin_promocao_info')
        .setLabel('PROMOÇÃO')
        .setEmoji('📈')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('admin_rebaixamento_info')
        .setLabel('REBAIXAMENTO')
        .setEmoji('📉')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('admin_exoneracao_info')
        .setLabel('EXONERAÇÃO')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('admin_blacklist_info')
        .setLabel('BLACKLIST')
        .setEmoji('⚫')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

/* =========================================================
   29 — MODAIS ADMINISTRATIVOS
========================================================= */

function adminProcedureModal(type) {
  const titles = {
    promocao: 'Registrar Promoção',
    rebaixamento: 'Registrar Rebaixamento',
    exoneracao: 'Registrar Exoneração',
    blacklist: 'Registrar Blacklist'
  };

  const modal =
    new ModalBuilder()
      .setCustomId(`admin_modal:${type}`)
      .setTitle(
        titles[type] || 'Procedimento Administrativo'
      );

  const member = new TextInputBuilder()
    .setCustomId('member_id')
    .setLabel('ID do membro')
    .setPlaceholder('ID do Discord')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(25);

  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('Motivo')
    .setPlaceholder('Descreva o motivo da ação')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(member),
    new ActionRowBuilder().addComponents(reason)
  );

  if (
    type === 'promocao' ||
    type === 'rebaixamento'
  ) {
    const oldRank = new TextInputBuilder()
      .setCustomId('old_rank')
      .setLabel('Cargo anterior')
      .setPlaceholder('Cargo atual')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const newRank = new TextInputBuilder()
      .setCustomId('new_rank')
      .setLabel('Novo cargo')
      .setPlaceholder('Novo cargo')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    modal.addComponents(
      new ActionRowBuilder().addComponents(oldRank),
      new ActionRowBuilder().addComponents(newRank)
    );
  }

  return modal;
}

/* =========================================================
   30 — PROCESSAMENTO ADMIN
========================================================= */

async function processAdminProcedure(
  interaction,
  type
) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'ACESSO RESTRITO',
          'Você não possui autorização para executar procedimentos administrativos.'
        )
      ],
      ephemeral: true
    });
  }

  const memberId =
    interaction.fields
      .getTextInputValue('member_id')
      .trim();

  const reason =
    interaction.fields
      .getTextInputValue('reason')
      .trim();

  let member;

  try {
    member =
      await interaction.guild.members.fetch(
        memberId
      );
  } catch {
    return interaction.reply({
      embeds: [
        errorEmbed(
          'MEMBRO NÃO ENCONTRADO',
          'Não foi possível localizar o membro informado.'
        )
      ],
      ephemeral: true
    });
  }

  if (type === 'exoneracao') {
    const removable =
      member.roles.cache.filter(role =>
        role.id !== interaction.guild.id &&
        !CONFIG.roles.preserveOnExoneration.includes(
          role.id
        )
      );

    await member.roles.remove(removable);

    await logAction(
      interaction.guild,
      'EXONERAÇÃO',
      [
        `**Membro:** ${member}`,
        `**Responsável:** ${interaction.user}`,
        `**Motivo:** ${reason}`
      ].join('\n'),
      CONFIG.brand.danger
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          'EXONERAÇÃO REGISTRADA',
