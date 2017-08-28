const conf = require('../conf/conf.json');

module.exports = {
  IRC_SERVER_NAME: conf.irc.server,
  IRC_SERVER_OPTS: conf.irc.opts,

  USERNAME_LOGIN: conf.irc.username,
  USERNAME_TOEKNEE: 'toeknee',
  USERNAME_JOUGHBAGH: 'joughbagh',

  USERNAME_PTMBOT: 'PTMBot',
  USERNAME_PRETOME: 'PRETOME',
  USERNAME_NICKSERV: 'NickServ',
  USERNAME_CHANSERV: 'chanserv',

  CMD_PRIVMSG: 'PRIVMSG',

  CHANNEL_NAME_VIP: '#Vip',
  CHANNEL_NAME_PRETOME: '#pretome',
  CHANNEL_NAME_IDLE_RPG: '#idleRPG',

  MSG_PASSWORD_ACCEPTED: 'Password accepted - you are now recognized.',
  MSG_NEED_TO_IDENTIFY: 'nick, type \u0002/msg NickServ IDENTIFY \u001fpassword\u001f\u0002.  Otherwise,',
  MSG_VIP_INVITE: 'To join #Vip type /msg chanserv invite #Vip',
  MSG_IDENTIFICATION_REQUEST: `IDENTIFY ${conf.irc.password}`,
  MSG_VIP_INVITE_REQUEST: 'invite #Vip',

  FILE_LAST_DISCONNECT: conf.irc.lastDisconnectFile,
};
