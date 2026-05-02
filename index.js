require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

/* =========================
   COMMAND HANDLER
========================= */

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: /${command.data.name}`);
    } else {
      console.log(`⚠️ Command ${file} is missing data or execute.`);
    }
  }
} else {
  console.log('⚠️ No commands folder found.');
}

/* =========================
   READY
========================= */

client.once('ready', () => {
  console.log(`✅ Fieb Little Helper is online as ${client.user.tag}`);
  console.log('ℹ️ Auto Fortnite stats check is disabled.');
});

/* =========================
   INTERACTION HANDLER
========================= */

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`⚠️ No command found for /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    const errorMessage = {
      content: '❌ Something went wrong while executing this command.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

/* =========================
   LOGIN
========================= */

client.login(process.env.DISCORD_TOKEN);