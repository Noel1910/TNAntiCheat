import { Player } from '@minecraft/server';
import config from '../config.js';
import { Util } from '../util/util';
import { getItemPunishment, itemMessageBuilder, isIllegalItem, isShulkerBox, isSpawnEgg } from './util';

export function placeCheckA(ev) {
  const { source, item } = ev;
  if (!config.placeCheckA.state || !(source instanceof Player) || Util.isOP(source)) return;
  if (isIllegalItem(item?.typeId)) {
    ev.cancel = true;
    Util.flag(source, 'PlaceCheck/A', getItemPunishment(item.typeId), `禁止アイテムの使用を検知しました (${itemMessageBuilder(item)})`, config.placeCheckA.notifyCreative);
  }
  if (config.placeCheckA.antiShulker && isShulkerBox(item?.typeId)) {
    Util.notify(`§c${item.typeId}§f の使用は許可されていません`, source);
    ev.cancel = true;
  }
}

export function placeCheckB(ev) {
  const { block, player } = ev;
  if (!config.placeCheckB.state || !config.placeCheckB.detect.includes(block.typeId) || Util.isOP(player)) return;
  const container = block.getComponent('inventory')?.container;
  if (!container) return;
  const checkedItems = [];
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (isIllegalItem(item?.typeId) || (config.placeCheckB.spawnEgg && isSpawnEgg(item?.typeId))) {
      checkedItems.push(item);
      container.clearItem(i);
    }
  }
  if (checkedItems.length > 0) {
    let flagMsg = checkedItems.slice(0, 3).map(item => itemMessageBuilder(item)).join('\n');
    if (checkedItems.length > 3) flagMsg += `\n§amore ${checkedItems.length - 3} items...`;
    Util.flag(player, 'PlaceCheck/B', config.placeCheckB.punishment, `設置した ${block.typeId} に禁止アイテムが含まれています\n${flagMsg}`);
  }
}

export async function placeCheckC(ev) {
  const { block, player } = ev;
  if (!config.placeCheckC.state || !config.placeCheckC.detect.includes(block.typeId) || Util.isOP(player)) return;
  const permutation = block.permutation.clone();
  await player.runCommandAsync(`setblock ${block.x} ${block.y} ${block.z} ${block.typeId}`);
  block.setPermutation(permutation);
  if (config.others.debug) console.warn(`[DEBUG] PlaceCheckC: Reset: ${block.typeId}`);
}