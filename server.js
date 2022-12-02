require('dotenv').config();
const express = require('express');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const cors = require('cors');
const { Client, Events, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const dbConnection = require('./db');

const { DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, APP_PORT } = process.env;

// ===========================
// Démarrage du BOT DISCORD
// ===========================

// Create a new client instance
const client = new Client({ intents: ['Guilds', 'GuildMessages', 'GuildPresences', 'MessageContent', 'GuildMembers'] });

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Quand un message est envoyé dans un salon DISCORD_CHANNEL_ID
client.on('messageCreate', (message) => {
  if (message.channel.id !== DISCORD_CHANNEL_ID) return;

  if (message.content.startsWith('/commandes')) {
    const exampleEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Commande(s)')
      .setURL('https://shyronax.github.io/meauxlotov/')
      .setAuthor({
        name: "COMMU' NIQUEZ",
        iconURL: 'https://shyronax.github.io/meauxlotov/img/logo.png',
        url: 'https://shyronax.github.io/meauxlotov/',
      })
      .setThumbnail('https://shyronax.github.io/meauxlotov/img/logo.png')
      .addFields({ name: 'Posez une question !', value: '/question { Votre question }', inline: true })
      .setImage('https://shyronax.github.io/meauxlotov/img/logo.png')
      .setTimestamp();
    message.channel.send({ embeds: [exampleEmbed] });
    return;
  } else if (message.content.startsWith('/question')) {
    const question = message.content.replace('/question', '').trim();

    // Récuperer les informations de l'utilisateur ayant posté sur Discord
    const userMessage = sanitizeHtml(question);
    const userId = sanitizeHtml(message.author.id);
    const userName = sanitizeHtml(message.author.username);

    // @todo: Empêcher le spam d'un même utilisateur avec un système de timeout (~5s d'intervalle)

    dbConnection.query(
      'INSERT INTO messages(message, discord_user_id, discord_user_name) VALUES (?, ?, ?)',
      [userMessage, userId, userName],
      function (err) {
        if (err) return console.log('Ereur', err);

        pushToClients({
          userName,
          userMessage,
        });
      }
    );
  }
});

client.login(DISCORD_BOT_TOKEN);

// ===========================
// Démarrage de l'app Express
// ===========================

const app = express();

app.use(cors());

// Liste des clients connectés
let clients = [];

// Route pour les clients : qu'ils puissent s'abonner aux events server
app.get('/events', (request, response) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  response.writeHead(200, headers);

  const newClient = {
    id: Date.now(),
    response,
  };
  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== newClient.id);
  });

  response.write('');
});

app.listen(APP_PORT, () => console.log(`App listening on port :${APP_PORT}`));

// Fonction qui envoie les données aux clients connectés
function pushToClients(data) {
  clients.forEach((client) => {
    client.response.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}
