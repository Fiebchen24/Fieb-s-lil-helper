const { SlashCommandBuilder } = require('discord.js');
const { getFortnitePR, getRoleByStats } = require('../utils/fortniteTracker');
const { loadLinks } = require('../utils/playerLinks');

const STAT_ROLES = [
  'Community',
  'Competitive',
  'Esports',
  'Pro',
  'Earned Player'
];

async function applyStatsRole(guild, member, roleName) {
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (!role) {
    throw new Error(`Role "${roleName}" does not exist.`);
  }

  for (const name of STAT_ROLES) {
    const oldRole = guild.roles.cache.find(r => r.name === name);

    if (oldRole && member.roles.cache.has(oldRole.id)) {
      await member.roles.remove(oldRole);
    }
  }

  await member.roles.add(role);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkstats')
    .setDescription('Checks linked Fortnite Tracker PR and updates the user role.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Discord user')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');

    const links = loadLinks();
    const link = links.find(x => x.userId === user.id);

    if (!link) {
      return interaction.editReply(
        '❌ This user has no linked Epic.\nUse `/playerlink` first.'
      );
    }

    let member;

    try {
      member = await interaction.guild.members.fetch(user.id);
    } catch (error) {
      console.error('Member Fetch Error:', error);

      return interaction.editReply(
        '❌ Could not find this user in the server.'
      );
    }

    try {
      const stats = await getFortnitePR({
        epic: link.epic,
        platform: link.platform || 'pc',
        region: link.region || 'EU'
      });

      const roleName = getRoleByStats(stats);

      await applyStatsRole(interaction.guild, member, roleName);

      return interaction.editReply(
        `✅ Fortnite Tracker stats checked.\n\n` +
        `User: ${user}\n` +
        `Epic: **${link.epic}**\n` +
        `Platform: **${link.platform || 'pc'}**\n` +
        `Region: **${link.region || 'EU'}**\n` +
        `Assigned role: **${roleName}**`
      );
    } catch (error) {
      console.error('Fortnite Tracker Error:', error);

      return interaction.editReply(
        `❌ Could not check Fortnite Tracker stats.\n` +
        `Error: \`${error.message}\``
      );
    }
  },

  applyStatsRole
};