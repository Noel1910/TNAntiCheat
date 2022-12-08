import { Util } from '../util/util';
import * as mc from '@minecraft/server';
const { world, system } = mc;
import toJson from '../lib/toJson';
import { Permissions } from '../util/Permissions';

export default {
  name: 'runjs',
  aliases: [ 'eval' ],
  args: [ '<code: string>' ],
  permission: (player) => Util.isOP(player),
  func: (sender, args) => {
    eval(args.join(' '));
  }
}