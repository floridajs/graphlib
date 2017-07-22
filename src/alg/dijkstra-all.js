//@flow
import { dijkstra } from './dijkstra'
import * as _ from 'lodash'

export function dijkstraAll (g, weightFunc, edgeFunc) {
  return _.transform(g.nodes(), (acc, v) => {
    acc[v] = dijkstra(g, v, weightFunc, edgeFunc)
  }, {})
}
