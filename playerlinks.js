const { SlashCommandBuilder } = require('discord.js');
const { upsertLink } = require('../utils/playerLinks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playerlink')
    .setDescription('Links a Discord user with an Epic Games name.')
    .addUserOption(option =>
      option.setName('user').setDescription('Discord user').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('epic').setDescription('Epic Games name').setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('platform')
        .setDescription('Platform')
        .setRequired(false)
        .addChoices(
          { name: 'PC', value: 'pc' },
          { name: 'Console', value: 'console' },
          { name: 'Mobile', value: 'mobile' }
        )
    )
    .addStringOption(option =>
      option.setName('region').setDescription('Region, e.g. EU, NAE, NAC').setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const epic = interaction.options.getString('epic');
    const platform = interaction.options.getString('platform') || 'pc';
    const region = interaction.options.getString('region') || 'EU';

    upsertLink({
      userId: user.id,
      epic,
      platform,
      region
    });

    await interaction.reply({
      content: `✅ Linked ${user} with Epic **${epic}** | ${platform} | ${region}`,
      ephemeral: true
    });
  }
};