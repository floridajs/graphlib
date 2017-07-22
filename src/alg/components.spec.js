
import _ from 'lodash'
import { Graph, alg } from '../index'

const { components } = alg

describe('alg.components', () => {
  it('returns an empty list for an empty graph', () => {
    expect(components(new Graph({directed: false}))).toEqual([])
  })

  it('returns singleton lists for unconnected nodes', () => {
    const g = new Graph({directed: false})
    g.setNode('a')
    g.setNode('b')

    const result = _.sortBy(components(g), arr => _.min(arr))
    expect(result).toEqual([['a'], ['b']])
  })

  it('returns a list of nodes in a component', () => {
    const g = new Graph({directed: false})
    g.setEdge('a', 'b')
    g.setEdge('b', 'c')

    const result = _.map(components(g), xs => _.sortBy(xs))
    expect(result).toEqual([['a', 'b', 'c']])
  })

  it('returns nodes connected by a neighbor relationship in a digraph', () => {
    const g = new Graph()
    g.setPath(['a', 'b', 'c', 'a'])
    g.setEdge('d', 'c')
    g.setEdge('e', 'f')

    const result = _.sortBy(_.map(components(g), xs => _.sortBy(xs)),
      '0')
    expect(result).toEqual([['a', 'b', 'c', 'd'], ['e', 'f']])
  })
})
