import { Graph, json } from './index'

const {read, write} = json

describe('json', () => {
  it('preserves the graph options', () => {
    expect(rw(new Graph({directed: true})).isDirected).toEqual(true)
    expect(rw(new Graph({directed: false})).isDirected).toEqual(false)
    expect(rw(new Graph({multigraph: true})).isMultigraph).toEqual(true)
    expect(rw(new Graph({multigraph: false})).isMultigraph).toEqual(false)
    expect(rw(new Graph({compound: true})).isCompound).toEqual(true)
    expect(rw(new Graph({compound: false})).isCompound).toEqual(false)
  })

  it('preserves the graph value, if any', () => {
    expect(rw(new Graph().setGraph(1)).graph()).toEqual(1)
    expect(rw(new Graph().setGraph({foo: 'bar'})).graph()).toEqual({foo: 'bar'})
    expect(rw(new Graph()).graph()).toEqual(undefined)
  })

  it('preserves nodes', () => {
    expect(rw(new Graph().setNode('a')).hasNode('a')).toEqual(true)
    expect(rw(new Graph().setNode('a')).node('a')).toEqual(undefined)
    expect(rw(new Graph().setNode('a', 1)).node('a')).toEqual(1)
    expect(rw(new Graph().setNode('a', {foo: 'bar'})).node('a'))
      .toEqual({foo: 'bar'})
  })

  it('preserves simple edges', () => {
    expect(rw(new Graph().setEdge('a', 'b')).hasEdge('a', 'b')).toEqual(true)
    expect(rw(new Graph().setEdge('a', 'b')).edge('a', 'b')).toEqual(undefined)
    expect(rw(new Graph().setEdge('a', 'b', 1)).edge('a', 'b')).toEqual(1)
    expect(rw(new Graph().setEdge('a', 'b', {foo: 'bar'})).edge('a', 'b'))
      .toEqual({foo: 'bar'})
  })

  it('preserves multi-edges', () => {
    const g = new Graph({multigraph: true})

    g.setEdge({v: 'a', w: 'b', name: 'foo'})
    expect(rw(g).hasEdge('a', 'b', 'foo')).toEqual(true)

    g.setEdge({v: 'a', w: 'b', name: 'foo'})
    expect(rw(g).edge('a', 'b', 'foo')).toEqual(undefined)

    g.setEdge({v: 'a', w: 'b', name: 'foo'}, 1)
    expect(rw(g).edge('a', 'b', 'foo')).toEqual(1)

    g.setEdge({v: 'a', w: 'b', name: 'foo'}, {foo: 'bar'})
    expect(rw(g).edge('a', 'b', 'foo')).toEqual({foo: 'bar'})
  })

  it('preserves parent / child relationships', () => {
    expect(rw(new Graph({compound: true}).setNode('a')).parent('a'))
      .toEqual(undefined)
    expect(rw(new Graph({compound: true}).setParent('a', 'parent')).parent('a'))
      .toEqual('parent')
  })
})

function rw (g) {
  return read(write(g))
}
