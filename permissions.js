const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function isStaff(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return (config.roles.staff || []).some((roleId) => member.roles.cache.has(roleId));
}

module.exports = { isStaff };
