import { world, system, Player, Entity, Vector, GameMode } from '@minecraft/server';
import * as UI from '@minecraft/server-ui';
import config from '../config.js';
import { properties } from './constants';
import { Permissions } from './Permissions';

const overworld = world.getDimension('overworld');

export class Util {

  /**
   *
   * @param {Player} player
   * @param {string} type
   * @param {string} punishment
   * @param {string} message
   * @param {boolean} notifyCreative
   */
  static flag(player, type, punishment, message, notifyCreative) {
    if (notifyCreative && Util.isCreative(player)) punishment = 'notify';
    const reasons = [
      `§7Type: §c${type}§r`,
      `§7Punishment: §c${punishment}§r`,
      `§l§6>>§r ${message}`
    ];
    
    if (punishment === 'ban') {
      this.ban(player, message, type);
      this.notify(`§lFlagged §r${this.safeString(player.name, 25)}§r\n${reasons.join('\n')}`);
      
    } else if (punishment === 'kick') {
      this.kick(player, reasons.join('\n'));
      this.notify(`§lFlagged §r${this.safeString(player.name, 25)}§r\n${reasons.join('\n')}`);
      
    } else if (punishment === 'tempkick') {
      player.triggerEvent('tn:kick');
      this.notify(`§lFlagged §r${this.safeString(player.name, 25)}§r\n${reasons.join('\n')}`);
      
    } else if (punishment === 'notify') {
      reasons.splice(1, 1);
      this.notify(`§lFlagged §r${this.safeString(player.name, 25)}§r\n${reasons.join('\n')}`);
      
    } else if (punishment === 'none') {
    } else {
      throw new Error(`Received unexpected punishment type: ${punishment}`);
      
    }
  }
  
  static async ban(player, reason, type) {
    player.setDynamicProperty(properties.ban, true);
    type && player.setDynamicProperty(properties.banReason, type);
    return await this.kick(player, `${type ? `§7Type: §c${type}§r\n` : ''}§7Reason: §r${reason}§r`, true);
  }

  static async kick(player, reason, ban = false) {
    if (Util.isOwner(player)) return console.warn('kick failed: cannot kick owner');
    try {
      await overworld.runCommandAsync(`kick "${player.name}" §l${ban ? '§cBanned§r' : 'Kicked'} by TN-AntiCheat§r\n${reason}`);
      return true;
    } catch {
      player.triggerEvent('tn:kick');
      this.notify('Kickに失敗したため強制退出させました');
      return false;
    }
  }
  
  static notify(message, target) {
    const name = config.others.shortName ? 'TN-AC' : 'TN-AntiCheat';
    if (target instanceof Player) {
      target.tell(`[§l§a${name}§r] ${message}`);
    } else {
      config.others.sendws
        ? overworld.runCommandAsync(`say "[§l§aTN-AntiCheat§r] ${message}"`)
        : world.say(`[§l§a${name}§r] ${message}`);
    }
  }
  
  static unban(player) {
    try {
      if (player.hasTag(config.permission.ban.tag)) player.removeTag(config.permission.ban.tag);
      player.removeDynamicProperty(properties.ban);
      player.removeDynamicProperty(properties.banReason);
    } catch {}
  }
  
  static isBanned(player) {
    return Permissions.has(player, 'ban') || player.getDynamicProperty(properties.ban);
  }
  
  static isOP(player) {
    return player && player.typeId === 'minecraft:player' && player.isOp() && Permissions.has(player, 'admin');
  }
  
  
  static isHost(player) {
    return player.id === '-4294967295';
  }
  
  static isOwner(player) {
    return world.getDynamicProperty(properties.ownerId) === player.id;
  }
  
  static sendMsg(msg, target = '@a') {
    if (!target.match(/@s|@p|@a|@r|@e/)) target = `"${target}"`;
    let rawtext = JSON.stringify({
      rawtext: [{ text: String(msg) }]
    });
    return overworld.runCommandAsync(`tellraw ${target} ${rawtext}`);
  }
  
  static safeString(str, length) {
    return str.length > length ? `${str.slice(0,length)}...` : str;
  }
  
  static splitNicely(str) {
    const split = str.split(/(?<!['"]\w+) +(?!\w+['"])/);
    return split.map(x => x.replace(/^"(.*)"$/g, '$1'));
  }
  
  static distance(vec1, vec2) {
    return Vector.distance(vec1, vec2);
  }
  
  static median(numbers) {
    const half = (numbers.length / 2) | 0;
    const arr = numbers.slice().sort((a,b) =>  a - b);
    return (arr.length % 2 ? arr[half] : (arr[half-1] + arr[half]) / 2) || 0;
  }
  
  static average(numbers) {
    return (numbers.reduce((a,b) => a + b, 0) / numbers.length) || 0;
  }
    
  /**
   * プレイヤーのゲームモードを取得します。ゲームモードが取得できない場合はundefinedが返ります。
   * Thanks: https://discord.com/channels/950040604186931351/969011166443626506/1030299392697184346
   * @param {Player} player
   * @returns {string | undefined}
   */
  static getGamemode(player) {
    for (const gamemodeName in GameMode) {
      if ([...world.getPlayers({ name: player.name, gameMode: GameMode[gamemodeName] })].length > 0) {
        return GameMode[gamemodeName];
      }
    }
  }
    
  static isSurvival(player) {
    return this.getGamemode(player) === GameMode.survival;
  }
  
  static isCreative(player) {
    return this.getGamemode(player) === GameMode.creative;
  }
  
  static isAdventure(player) {
    return this.getGamemode(player) === GameMode.adventure;
  }
  
  static isSpectator(player) {
    return this.getGamemode(player) === GameMode.spectator;
  }
  
  static cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  static getTime() {
    const d = new Date();
    const month = ('0' + (d.getMonth()+1)).slice(-2);
    const date = ('0' + d.getDate()).slice(-2);
    const hour = ('0' + d.getHours()).slice(-2);
    const minute = ('0' + d.getMinutes()).slice(-2);
    const second = ('0' + d.getSeconds()).slice(-2);
    return `${month}/${date} ${hour}:${minute}:${second}`;
  }
  
  static parseMS(ms) {
    const time = ms / 1000;
    const sec = time % 60;
    const min = Math.floor(time / 60) % 60;
    const hour = Math.floor(time / 3600);

    return `${hour}時間 ${min}分 ${Math.floor(sec)}秒`
  }
  
  /**
   * Thanks: https://discord.com/channels/950040604186931351/954636266614439986/1035305927655559300
   * @author aikayu1op.js
   */
  static showFormToBusy(player, form) {
    player.tell(`§7[AdminPanel] チャットを閉じると表示されます`);
    return new Promise(res => {
      system.run(async function run() {
        const response = await form.show(player);
        const {canceled, cancelationReason: reason} = response;
        if (canceled && reason === UI.FormCancelationReason.userBusy) return system.run(run);
        res(response);
      });
    });
  }
  
  static hideString(str) {
    return str.replace(/(.)/g, '§$1');
  }
  
  static getHoldingItem(player) {
    return player.getComponent('minecraft:inventory').container.getItem(player.selectedSlot);
  }
  
  static getPlayerByName(playerName, expect = false) {
    const [ player ] = [...world.getPlayers({ name: playerName })];
    if (player || !expect) return player;
    return world.getAllPlayers().find(p => p.name.includes(playerName) || p.name.toLowerCase().includes(playerName.toLowerCase()));
  }
  
  static vectorNicely(vec) {
    return { x: Math.floor(vec.x), y: Math.floor(vec.y), z: Math.floor(vec.z) };
  }

  /**
   *
   * @param {Player|Entity|string} target
   * @param {string} obj
   * @returns {number|null}
   */
  static getScore(target, obj) {
    try {
      return (typeof target === 'string')
        ? world.scoreboard.getObjective(obj).getScores().find(({ participant }) => participant.displayName === target).score
        : world.scoreboard.getObjective(obj).getScore(target.scoreboard);
    } catch {
      return null;
    }
  }
  
  /**
   *
   * @param {Player|Entity|string} target
   * @param {string} obj
   * @param {number} score
   */
  static async setScore(target, obj, score) {
    const name = (typeof target === 'string') ? target : (target.name ?? target.nameTag);
    await overworld.runCommandAsync(`scoreboard players set "${name}" ${obj} ${score}`);
  }
}