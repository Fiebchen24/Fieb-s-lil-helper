const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletevoices')
    .setDescription('Deletes all voice channels in a selected category.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    .addChannelOption(option =>
      option.setName('category')
        .setDescription('Select category')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const category = interaction.options.getChannel('category');

    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.editReply('❌ Please select a valid category.');
    }

    const channels = interaction.guild.channels.cache.filter(
      c => c.parentId === category.id && c.type === ChannelType.GuildVoice
    );

    if (channels.size === 0) {
      return interaction.editReply('❌ No voice channels found in this category.');
    }

    let deleted = 0;
    let failed = 0;

    for (const channel of channels.values()) {
      try {
        await channel.delete();
        deleted++;
      } catch (error) {
        console.error(`Failed to delete ${channel.name}:`, error.message);
        failed++;
      }
    }

    return interaction.editReply(
      `🗑️ Deleted **${deleted}** voice channel(s) from **${category.name}**.\n` +
      (failed ? `❌ Failed: **${failed}**` : '')
    );
  }
};