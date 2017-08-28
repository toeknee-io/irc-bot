const fs = require('fs');
const net = require('net');
const irc = require('irc');
const _ = require('lodash');

const C = require('./lib/constants.js');
const Utilities = require('./lib/util.js');

const SOCKET_PORT = 1122;
const lastDisc = _.attempt(() => _.toNumber(fs.readFileSync(C.FILE_LAST_DISCONNECT, 'utf8')));

let i = 0;

if (!_.isError(lastDisc) && lastDisc > (Date.now() - 5000)) {
  console.log(`last disconnect was less than 5 seconds ago (${lastDisc}), exiting`);
  process.exit(1);
}

const client = new irc.Client(C.IRC_SERVER_NAME, C.USERNAME_LOGIN, C.IRC_SERVER_OPTS);
const util = new Utilities(client);

const ircChannelUsers = {};

client.addListener('error', message => console.error(`[ERROR] ${console.dir(message)}`));

client.addListener('motd', motd => console.log(`[MOTD] ${motd}`));

client.addListener('notice', (from, to, message) => {
  console.log(`[NOTICE] ${from || 'Unknown'} => ${to === C.USERNAME_LOGIN ? 'Me' : to}: ${message}`);
  if (Utilities.isFromPre(from)) {
    if (message === C.MSG_NEED_TO_IDENTIFY) {
      console.log('pretome acct was not recognized');
      util.sendIdentification();
    } else if (message === C.MSG_PASSWORD_ACCEPTED) {
      console.log('pretome acct was successfully recognized');
      util.joinChannel(C.CHANNEL_NAME_PRETOME);
      util.joinChannel(C.CHANNEL_NAME_IDLE_RPG);
      util.joinChannel(C.CHANNEL_NAME_ANNOUNCE);
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

client.addListener('names', (ch, nicks) => {
  ircChannelUsers[ch] = nicks;
  console.log(`[${ch}] nicks:`, nicks);
});

client.addListener('action', (from, to, text) => console.log(`[${to}] ${from} ${text}`));

client.addListener('nick', (oldNick, newNick) => console.log(`${oldNick} changed nickname to: ${newNick}`));
client.addListener('topic', (ch, topic, user) => console.log(`[${ch}] ${user} set topic to: ${topic}`));

client.addListener('join', (ch, user) => console.log(`${user} joined channel ${ch}`));

client.addListener('part', (ch, user, reason) => console.log(`${user} left channel ${ch}: ${reason}`));
client.addListener('kick', (ch, user, by, reason) => console.log(`${user} kicked from ${ch} by ${by}: ${reason}`));

client.addListener('quit', (user, reason) => console.log(`${user} quit IRC: ${reason}`));
client.addListener('kill', (user, reason) => console.log(`${user} disconnected by server: ${reason}`));

['+', '-'].forEach(a => client.addListener(`${a}mode`, (ch, by, mode, arg) => console.log(`[${ch}] mode change: ${by} set ${a}${mode} for ${arg}`)));

const server = net.createServer((s) => {
  s.setEncoding('utf8');

  s.on('data', (data) => {
    const d = data.trim();

    if (d.startsWith('say')) {
      const target = d.split(/\s/)[1];
      const message = d.split(target)[1];

      if (typeof target === 'string' && typeof message === 'string') {
        util.sendMsg(target.trim(), message.trim());
      }
    } else if (d.startsWith('join')) {
      util.joinChannel(d.split(/\s/)[1]);
    } else if (d.startsWith('raw')) {
      const cmdArray = d.split(/\s/);

      const cmd = cmdArray[1];
      const arg1 = cmdArray[2];
      const arg2 = cmdArray[3];
      const arg3 = cmdArray[4];

      client.send(cmd, arg1, arg2, arg3);
    } else if (d.startsWith('server_connCount')) {
      server.getConnections((err, count) => console.log(`socket connections: ${count}`));
    } else if (d === 'exit') {
      s.end();
    } else {
      console.log(`received unsupported socket cmd: ${d}`);
    }
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    setTimeout(() => {
      server.close();
      server.listen({ port: SOCKET_PORT + (i += 1), host: 'localhost' });
    }, 250);
  }
});

server.on('listening', () => console.log('socket server listening to', server.address()));
server.on('close', () => console.log('socket server stopped listening to', server.address()));

server.listen({ port: SOCKET_PORT, host: 'localhost' });

process.on('SIGINT', () => {
  console.log('disconnecting from irc and exiting');

  client.disconnect(() => {
    server.close();
    fs.writeFileSync(C.FILE_LAST_DISCONNECT, Date.now(), 'utf8');
    process.exit(0);
  });
});

if (Utilities.debugOn()) {
  Utilities.debugLog('Debug ENABLED');
  client.addListener('raw', msgObj => console.dir(msgObj));
  client.addListener('whois', info => console.log(`whois: ${console.dir(info)}`));
}
