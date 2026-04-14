const config = require('../config');

function isStaff(member) {
  if (!member) return false;
  const staffRoleIds = [
    config.roles.host,
    config.roles.seniorHost,
    config.roles.resultStaff,
    config.roles.moderator
  ].filter(Boolean);

  return member.permissions.has('Administrator') ||
    staffRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

module.exports = { isStaff };
