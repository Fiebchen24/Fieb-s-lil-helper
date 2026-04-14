const { ChannelType } = require('discord.js');
const config = require('../config');

async function sendLog(client, channelId, content) {
  if (!channelId) return;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.type === ChannelType.GuildText) {
      await channel.send({ content });
    }
  } catch (error) {
    console.error('Failed to send log message:', error.message);
  }
}

async function staffLog(client, content) {
  await sendLog(client, config.channels.staffLog, content);
}

async function penaltyLog(client, content) {
  await sendLog(client, config.channels.penalties, content);
}

module.exports = {
  staffLog,
  penaltyLog
};
