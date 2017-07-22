
import { Graph, alg } from '../index'
import allShortestPathsTest from './all-shortest-paths.spec.util'

const { dijkstraAll } = alg

describe('alg.dijkstraAll', () => {
  allShortestPathsTest(dijkstraAll)

  it('throws an Error if it encounters a negative edge weight', () => {
    const g = new Graph()
    g.setEdge('a', 'b', 1)
    g.setEdge('a', 'c', -2)
    g.setEdge('b', 'd', 3)
    g.setEdge('c', 'd', 3)

    expect(() => { dijkstraAll(g, weight(g)) }).toThrow()
  })
})

function weight (g) {
  return e => g.getEdge(e)
}
