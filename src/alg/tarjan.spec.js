import _ from 'lodash'

import { Graph, alg } from '../index'

const { tarjan } = alg

describe('alg.tarjan', () => {
  it('returns an empty array for an empty graph', () => {
    expect(tarjan(new Graph())).toEqual([])
  })

  it('returns singletons for nodes not in a strongly connected component', () => {
    const g = new Graph()
    g.setPath(['a', 'b', 'c'])
    g.setEdge('d', 'c')
    expect(sort(tarjan(g))).toEqual([['a'], ['b'], ['c'], ['d']])
  })

  it('returns a single component for a cycle of 1 edge', () => {
    const g = new Graph()
    g.setPath(['a', 'b', 'a'])
    expect(sort(tarjan(g))).toEqual([['a', 'b']])
  })

  it('returns a single component for a triangle', () => {
    const g = new Graph()
    g.setPath(['a', 'b', 'c', 'a'])
    expect(sort(tarjan(g))).toEqual([['a', 'b', 'c']])
  })

  it('can find multiple components', () => {
    const g = new Graph()
    g.setPath(['a', 'b', 'a'])
    g.setPath(['c', 'd', 'e', 'c'])
    g.setNode('f')
    expect(sort(tarjan(g))).toEqual([['a', 'b'], ['c', 'd', 'e'], ['f']])
  })
})

// A helper that sorts components and their contents
function sort (cmpts) {
  return _.sortBy(_.map(cmpts, cmpt => _.sortBy(cmpt)), cmpts => cmpts[0])
}
