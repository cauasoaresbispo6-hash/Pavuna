require('dotenv').config();
const { REST, Routes } = require('discord.js');

// O arquivo principal registra os comandos automaticamente ao iniciar.
// Este arquivo existe como opção para quem quiser separar o deploy.
// Execute: node deploy-commands.js

console.log('Os comandos são registrados automaticamente pelo index.js ao iniciar.');
if (!process.env.DISCORD_TOKEN) console.error('DISCORD_TOKEN não definido no .env');
