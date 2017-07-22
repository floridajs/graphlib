//@flow
import * as _ from 'lodash'
import { tarjan } from './tarjan'

export function findCycles (g) {
  return _.filter(tarjan(g), cmpt => cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0])))
}
