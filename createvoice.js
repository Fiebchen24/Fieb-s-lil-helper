const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createvoice')
    .setDescription('Creates one or multiple voice channels in a selected category.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Base name, e.g. Trio Room')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('Select category')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('How many channels?')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50)
    )
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('User limit per channel')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(99)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const baseName = interaction.options.getString('name');
    const category = interaction.options.getChannel('category');
    const amount = interaction.options.getInteger('amount') || 1;
    const limit = interaction.options.getInteger('limit') || 0;

    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.editReply('❌ Please select a valid category.');
    }

    let created = [];
    let failed = 0;

    for (let i = 1; i <= amount; i++) {
      const channelName = amount === 1 ? baseName : `${baseName} ${i}`;

      try {
        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          userLimit: limit
        });

        created.push(channel.name);
      } catch (error) {
        console.error(`Failed to create ${channelName}:`, error.message);
        failed++;
      }
    }

    return interaction.editReply(
      `✅ Created **${created.length}** voice channel(s) in **${category.name}**.\n` +
      (created.length ? `Channels: ${created.map(name => `\`${name}\``).join(', ')}\n` : '') +
      (failed ? `❌ Failed: **${failed}**` : '')
    );
  }
};