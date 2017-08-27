/* eslint no-bitwise: ["error", { "allow": ["~"] }] */

const _ = require('lodash');
const C = require('./constants.js');

const debug = typeof v8debug === 'object';

class Utilities {
  constructor(client) {
    if (client) {
      this.client = client;
    } else {
      throw new Error('Client object missing during Utilities instantiation');
    }
  }

  sendMsg(to, msg) {
    if (typeof to === 'string' && to.startsWith('#')) {
      console.log(`[${to}] Me: ${msg}`);
    } else {
      console.log(`[PM] Me => ${to}: ${msg}`);
    }
    this.client.say(to, msg);
  }

  sendIdentification() {
    Utilities.debugLog('sending identify message');
    this.sendMsg(C.USERNAME_NICKSERV, C.MSG_IDENTIFICATION_REQUEST);
  }

  // eslint-disable-next-line no-unused-vars
  static isCmd(msgObj, cmd) {
    if (typeof msgObj === 'object' && msgObj.command === cmd) {
      return true;
    }
    return false;
  }

  isInChannel(channel, chans = this.client.chans) {
    const chansType = typeof chans;
    if (chansType === 'object') {
      return ~Object.keys(chans).indexOf(channel);
    }
    console.error(`ERROR isInChannel: client.chans is not an object, it's: ${chansType}`);
    return false;
  }

  static isChannel(channel, channelName) {
    if (typeof channel === 'string') {
      return channel.toLowerCase() === channelName;
    }
    console.error(`ERROR isChannel: channel is not an object, it's: ${typeof channel}`);
    return false;
  }

  static isFrom(fromActual, fromToTest) {
    return fromActual === fromToTest;
  }

  static isFromPre(from) {
    return from === C.USERNAME_PTMBOT || from === C.USERNAME_PRETOME
      || from === C.USERNAME_CHANSERV || from === C.USERNAME_NICKSERV;
  }

  requestVipChannelInvite() {
    if (!this.isInChannel(C.CHANNEL_NAME_VIP)) {
      Utilities.debugLog(`not in ${C.CHANNEL_NAME_VIP}, requesting invite`);
      this.sendMsg(C.USERNAME_CHANSERV, C.MSG_VIP_INVITE_REQUEST);
    } else {
      console.log(`not sending invite request for channel ${C.CHANNEL_NAME_VIP} because we're already in it`);
    }
  }

  joinChannel(pChannel) {
    const channel = _.startsWith(pChannel, '#') ? pChannel : `#${pChannel}`;

    if (!this.isInChannel(channel)) {
      Utilities.debugLog(`joining channel ${channel}`);
      this.client.join(channel);
    } else {
      console.log(`aborting joining channel ${channel} because we're already in it`);
    }
  }

  static debugOn() {
    return debug;
  }

  static debugLog(msg) {
    if (this.debugOn()) {
      console.log(`[DEBUG] ${msg}`);
    }
  }
}

module.exports = Utilities;
