const fs = require('fs');
const irc = require('irc');
const _ = require('lodash');

const C = require('./lib/constants.js');
const Utilities = require('./lib/util.js');

const lastDisc = _.attempt(() => _.toNumber(fs.readFileSync(C.FILE_LAST_DISCONNECT, 'utf8')));

console.log(`last disc ${lastDisc}`);

// if (!_.isError(lastDisc) && lastDisc > (Date.now() - 10000)) {
//   console.log(`last disconnect was less than 30 seconds ago (${lastDisc}), exiting`);
//   process.exit(1);
// }

const client = new irc.Client(C.IRC_SERVER_NAME, C.USERNAME_TOEKNEE, C.IRC_SERVER_OPTS);
const util = new Utilities(client);

process.on('exit', () => {
  console.log('disconnecting from irc and exiting');
});

process.on('SIGINT', () => {
  client.disconnect(() => {
    fs.writeFileSync(C.FILE_LAST_DISCONNECT, Date.now(), 'utf8');
    process.exit(0);
  });
});

client.addListener('error', message => console.error(`[ERROR] ${console.dir(message)}`));

client.addListener('motd', motd => console.log(`[MOTD] ${motd}`));

client.addListener('notice', (from, to, message) => {
  console.log(`[NOTICE] ${from || 'Unknown'} => ${to === C.USERNAME_TOEKNEE ? 'Me' : to}: ${message}`);
  if (Utilities.isFromPre(from)) {
    if (message === C.MSG_NEED_TO_IDENTIFY) {
      console.log('pretome acct was not recognized');
      util.sendIdentification();
    } else if (message === C.MSG_PASSWORD_ACCEPTED) {
      console.log('pretome acct was successfully recognized');
      util.joinChannel(C.CHANNEL_NAME_PRETOME);
      util.joinChannel(C.CHANNEL_NAME_IDLE_RPG);
    }
  }
});

client.addListener('invite', (channel, from) => {
  console.log(`[INVITE] from ${from} to channel ${channel}`);
  if (Utilities.isFromPre(from) && Utilities.isChannel(channel, C.CHANNEL_NAME_VIP)) {
    util.joinChannel(C.CHANNEL_NAME_VIP);
  }
});

client.addListener('message', (from, to, message) => {
  if (typeof to === 'string') {
    if (Utilities.isFromPre(from) && message === C.MSG_VIP_INVITE) {
      util.requestVipChannelInvite();
    }
    console.log(`[${to.startsWith('#') ? to : 'PM'}] ${from}: ${message}`);
  }
});

client.addListener('action', (from, to, text) => console.log(`[${to}] ${from} ${text}`));

client.addListener('nick', (oldNick, newNick) => console.log(`${oldNick} changed nickname to: ${newNick}`));
client.addListener('topic', (channel, topic, user) => console.log(`[${channel}] ${user} set topic to: ${topic}`));

client.addListener('join', (channel, user) => console.log(`${user} joined channel ${channel}`));

client.addListener('part', (channel, user, reason) => console.log(`${user} left ${channel}: ${reason}`));
client.addListener('kick', (channel, user, by, reason) => console.log(`${user} kicked from ${channel} by ${by}: ${reason}`));

client.addListener('quit', (user, reason) => console.log(`${user} quit IRC: ${reason}`));
client.addListener('kill', (user, reason) => console.log(`${user} disconnected by server: ${reason}`));

if (Utilities.debugOn()) {
  Utilities.debugLog('Debug ENABLED');
  client.addListener('raw', msgObj => console.dir(msgObj));
  client.addListener('whois', info => console.log(`whois: ${console.dir(info)}`));
}
