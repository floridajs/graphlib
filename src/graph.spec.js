import * as _ from 'lodash'

import { Graph } from './index'

describe('Graph', () => {
  let g

  beforeEach(() => {
    g = new Graph()
  })

  describe('initial state', () => {
    it('has no nodes', () => {
      expect(g.nodeCount()).toEqual(0)
    })

    it('has no edges', () => {
      expect(g.edgeCount()).toEqual(0)
    })

    it('has no attributes', () => {
      expect(g.graph()).toEqual(undefined)
    })

    it('defaults to a simple directed graph', () => {
      expect(g.isDirected).toEqual(true)
      expect(g.isCompound).toEqual(false)
      expect(g.isMultigraph).toEqual(false)
    })

    it('can be set to undirected', () => {
      const g = new Graph({directed: false})
      expect(g.isDirected).toEqual(false)
      expect(g.isCompound).toEqual(false)
      expect(g.isMultigraph).toEqual(false)
    })

    it('can be set to a compound graph', () => {
      const g = new Graph({compound: true})
      expect(g.isDirected).toEqual(true)
      expect(g.isCompound).toEqual(true)
      expect(g.isMultigraph).toEqual(false)
    })

    it('can be set to a mulitgraph', () => {
      const g = new Graph({multigraph: true})
      expect(g.isDirected).toEqual(true)
      expect(g.isCompound).toEqual(false)
      expect(g.isMultigraph).toEqual(true)
    })
  })

  describe('setGraph', () => {
    it('can be used to get and set properties for the graph', () => {
      g.setGraph('foo')
      expect(g.graph()).toEqual('foo')
    })

    it('is chainable', () => {
      expect(g.setGraph('foo')).toEqual(g)
    })
  })

  describe('nodes', () => {
    it('is empty if there are no nodes in the graph', () => {
      expect(g.nodes()).toEqual([])
    })

    it('returns the ids of nodes in the graph', () => {
      g.setNode('a')
      g.setNode('b')
      expect(_.sortBy(g.nodes())).toEqual(['a', 'b'])
    })
  })

  describe('sources', () => {
    it('returns nodes in the graph that have no in-edges', () => {
      g.setPath(['a', 'b', 'c'])
      g.setNode('d')
      expect(_.sortBy(g.sources())).toEqual(['a', 'd'])
    })
  })

  describe('sinks', () => {
    it('returns nodes in the graph that have no out-edges', () => {
      g.setPath(['a', 'b', 'c'])
      g.setNode('d')
      expect(_.sortBy(g.sinks())).toEqual(['c', 'd'])
    })
  })

  describe('filterNodes', () => {
    it('returns an identical graph when the filter selects everything', () => {
      g.setGraph('graph label')
      g.setNode('a', 123)
      g.setPath(['a', 'b', 'c'])
      g.setEdge('a', 'c', 456)
      const g2 = g.filterNodes(() => true)
      expect(_.sortBy(g2.nodes())).toEqual(['a', 'b', 'c'])
      expect(_.sortBy(g2.successors('a'))).toEqual(['b', 'c'])
      expect(_.sortBy(g2.successors('b'))).toEqual(['c'])
      expect(g2.node('a')).toEqual(123)
      expect(g2.edge('a', 'c')).toEqual(456)
      expect(g2.graph()).toEqual('graph label')
    })

    it('returns an empty graph when the filter selects nothing', () => {
      g.setPath(['a', 'b', 'c'])
      const g2 = g.filterNodes(() => false)
      expect(g2.nodes()).toEqual([])
      expect(g2.edges()).toEqual([])
    })

    it('only includes nodes for which the filter returns true', () => {
      g.setNodes(['a', 'b'])
      const g2 = g.filterNodes(v => v === 'a')
      expect(g2.nodes()).toEqual(['a'])
    })

    it('removes edges that are connected to removed nodes', () => {
      g.setEdge('a', 'b')
      const g2 = g.filterNodes(v => v === 'a')
      expect(_.sortBy(g2.nodes())).toEqual(['a'])
      expect(g2.edges()).toEqual([])
    })

    it('preserves the directed option', () => {
      g = new Graph({directed: true})
      expect(g.filterNodes(() => true).isDirected).toEqual(true)

      g = new Graph({directed: false})
      expect(g.filterNodes(() => true).isDirected).toEqual(false)
    })

    it('preserves the multigraph option', () => {
      g = new Graph({multigraph: true})
      expect(g.filterNodes(() => true).isMultigraph).toEqual(true)

      g = new Graph({multigraph: false})
      expect(g.filterNodes(() => true).isMultigraph).toEqual(false)
    })

    it('preserves the compound option', () => {
      g = new Graph({compound: true})
      expect(g.filterNodes(() => true).isCompound).toEqual(true)

      g = new Graph({compound: false})
      expect(g.filterNodes(() => true).isCompound).toEqual(false)
    })

    it('includes subgraphs', () => {
      g = new Graph({compound: true})
      g.setParent('a', 'parent')

      const g2 = g.filterNodes(() => true)
      expect(g2.parent('a')).toEqual('parent')
    })

    it('includes multi-level subgraphs', () => {
      g = new Graph({compound: true})
      g.setParent('a', 'parent')
      g.setParent('parent', 'root')

      const g2 = g.filterNodes(() => true)
      expect(g2.parent('a')).toEqual('parent')
      expect(g2.parent('parent')).toEqual('root')
    })

    it('promotes a node to a higher subgraph if its parent is not included', () => {
      g = new Graph({compound: true})
      g.setParent('a', 'parent')
      g.setParent('parent', 'root')

      const g2 = g.filterNodes(v => v !== 'parent')
      expect(g2.parent('a')).toEqual('root')
    })
  })

  describe('setNodes', () => {
    it('creates multiple nodes', () => {
      g.setNodes(['a', 'b', 'c'])
      expect(g.hasNode('a')).toEqual(true)
      expect(g.hasNode('b')).toEqual(true)
      expect(g.hasNode('c')).toEqual(true)
    })

    it('can set a value for all of the nodes', () => {
      g.setNodes(['a', 'b', 'c'], 'foo')
      expect(g.node('a')).toEqual('foo')
      expect(g.node('b')).toEqual('foo')
      expect(g.node('c')).toEqual('foo')
    })

    it('is chainable', () => {
      expect(g.setNodes(['a', 'b', 'c'])).toEqual(g)
    })
  })

  describe('setNode', () => {
    it('creates the node if it isn\'t part of the graph', () => {
      g.setNode('a')
      expect(g.hasNode('a')).toEqual(true)
      expect(g.node('a')).toEqual(undefined)
      expect(g.nodeCount()).toEqual(1)
    })

    it('can set a value for the node', () => {
      g.setNode('a', 'foo')
      expect(g.node('a')).toEqual('foo')
    })

    it('does not change the node\'s value with a 1-arg invocation', () => {
      g.setNode('a', 'foo')
      g.setNode('a')
      expect(g.node('a')).toEqual('foo')
    })

    it('can remove the node\'s value by passing undefined', () => {
      g.setNode('a', undefined)
      expect(g.node('a')).toEqual(undefined)
    })

    it('is idempotent', () => {
      g.setNode('a', 'foo')
      g.setNode('a', 'foo')
      expect(g.node('a')).toEqual('foo')
      expect(g.nodeCount()).toEqual(1)
    })

    it('uses the stringified form of the id', () => {
      g.setNode(1)
      expect(g.hasNode(1)).toEqual(true)
      expect(g.hasNode('1')).toEqual(true)
      expect(g.nodes()).toEqual(['1'])
    })

    it('is chainable', () => {
      expect(g.setNode('a')).toEqual(g)
    })
  })

  describe('setNodeDefaults', () => {
    it('sets a default label for new nodes', () => {
      g.setDefaultNodeLabel('foo')
      g.setNode('a')
      expect(g.node('a')).toEqual('foo')
    })

    it('does not change existing nodes', () => {
      g.setNode('a')
      g.setDefaultNodeLabel('foo')
      expect(g.node('a')).toEqual(undefined)
    })

    it('is not used if an explicit value is set', () => {
      g.setDefaultNodeLabel('foo')
      g.setNode('a', 'bar')
      expect(g.node('a')).toEqual('bar')
    })

    it('can take a function', () => {
      g.setDefaultNodeLabel(() => 'foo')
      g.setNode('a')
      expect(g.node('a')).toEqual('foo')
    })

    it('can take a function that takes the node\'s name', () => {
      g.setDefaultNodeLabel(v => `${v}-foo`)
      g.setNode('a')
      expect(g.node('a')).toEqual('a-foo')
    })

    it('is chainable', () => {
      expect(g.setDefaultNodeLabel('foo')).toEqual(g)
    })
  })

  describe('node', () => {
    it('returns undefined if the node isn\'t part of the graph', () => {
      expect(g.node('a')).toEqual(undefined)
    })

    it('returns the value of the node if it is part of the graph', () => {
      g.setNode('a', 'foo')
      expect(g.node('a')).toEqual('foo')
    })
  })

  describe('removeNode', () => {
    it('does nothing if the node is not in the graph', () => {
      expect(g.nodeCount()).toEqual(0)
      g.removeNode('a')
      expect(g.hasNode('a')).toEqual(false)
      expect(g.nodeCount()).toEqual(0)
    })

    it('removes the node if it is in the graph', () => {
      g.setNode('a')
      g.removeNode('a')
      expect(g.hasNode('a')).toEqual(false)
      expect(g.nodeCount()).toEqual(0)
    })

    it('is idempotent', () => {
      g.setNode('a')
      g.removeNode('a')
      g.removeNode('a')
      expect(g.hasNode('a')).toEqual(false)
      expect(g.nodeCount()).toEqual(0)
    })

    it('removes edges incident on the node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.removeNode('b')
      expect(g.edgeCount()).toEqual(0)
    })

    it('removes parent / child relationships for the node', () => {
      const g = new Graph({compound: true})
      g.setParent('c', 'b')
      g.setParent('b', 'a')
      g.removeNode('b')
      expect(g.parent('b')).toEqual(undefined)
      expect(g.children('b')).toEqual(undefined)
      expect(g.children('a')).not.toContain('b')
      expect(g.parent('c')).toEqual(undefined)
    })

    it('is chainable', () => {
      expect(g.removeNode('a')).toEqual(g)
    })
  })

  describe('setParent', () => {
    beforeEach(() => {
      g = new Graph({compound: true})
    })

    it('throws if the graph is not compound', () => {
      expect(() => { new Graph().setParent('a', 'parent') }).toThrow()
    })

    it('creates the parent if it does not exist', () => {
      g.setNode('a')
      g.setParent('a', 'parent')
      expect(g.hasNode('parent')).toEqual(true)
      expect(g.parent('a')).toEqual('parent')
    })

    it('creates the child if it does not exist', () => {
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(g.hasNode('a')).toEqual(true)
      expect(g.parent('a')).toEqual('parent')
    })

    it('has the parent as undefined if it has never been invoked', () => {
      g.setNode('a')
      expect(g.parent('a')).toEqual(undefined)
    })

    it('moves the node from the previous parent', () => {
      g.setParent('a', 'parent')
      g.setParent('a', 'parent2')
      expect(g.parent('a')).toEqual('parent2')
      expect(g.children('parent')).toEqual([])
      expect(g.children('parent2')).toEqual(['a'])
    })

    it('removes the parent if the parent is undefined', () => {
      g.setParent('a', 'parent')
      g.setParent('a', undefined)
      expect(g.parent('a')).toEqual(undefined)
      expect(_.sortBy(g.children())).toEqual(['a', 'parent'])
    })

    it('removes the parent if no parent was specified', () => {
      g.setParent('a', 'parent')
      g.setParent('a')
      expect(g.parent('a')).toEqual(undefined)
      expect(_.sortBy(g.children())).toEqual(['a', 'parent'])
    })

    it('is idempotent to remove a parent', () => {
      g.setParent('a', 'parent')
      g.setParent('a')
      g.setParent('a')
      expect(g.parent('a')).toEqual(undefined)
      expect(_.sortBy(g.children())).toEqual(['a', 'parent'])
    })

    it('uses the stringified form of the id', () => {
      g.setParent(2, 1)
      g.setParent(3, 2)
      expect(g.parent(2)).toEqual('1')
      expect(g.parent('2')).toEqual('1')
      expect(g.parent(3)).toEqual('2')
    })

    it('preserves the tree invariant', () => {
      g.setParent('c', 'b')
      g.setParent('b', 'a')
      expect(() => { g.setParent('a', 'c') }).toThrow()
    })

    it('is chainable', () => {
      expect(g.setParent('a', 'parent')).toEqual(g)
    })
  })

  describe('parent', () => {
    beforeEach(() => {
      g = new Graph({compound: true})
    })

    it('returns undefined if the graph is not compound', () => {
      expect(new Graph({compound: false}).parent('a')).toEqual(undefined)
    })

    it('returns undefined if the node is not in the graph', () => {
      expect(g.parent('a')).toEqual(undefined)
    })

    it('defaults to undefined for new nodes', () => {
      g.setNode('a')
      expect(g.parent('a')).toEqual(undefined)
    })

    it('returns the current parent assignment', () => {
      g.setNode('a')
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(g.parent('a')).toEqual('parent')
    })
  })

  describe('children', () => {
    beforeEach(() => {
      g = new Graph({compound: true})
    })

    it('returns undefined if the node is not in the graph', () => {
      expect(g.children('a')).toEqual(undefined)
    })

    it('defaults to en empty list for new nodes', () => {
      g.setNode('a')
      expect(g.children('a')).toEqual([])
    })

    it('returns undefined for a non-compound graph without the node', () => {
      const g = new Graph()
      expect(g.children('a')).toEqual(undefined)
    })

    it('returns an empty list for a non-compound graph with the node', () => {
      const g = new Graph()
      g.setNode('a')
      expect(g.children('a')).toEqual([])
    })

    it('returns all nodes for the root of a non-compound graph', () => {
      const g = new Graph()
      g.setNode('a')
      g.setNode('b')
      expect(_.sortBy(g.children())).toEqual(['a', 'b'])
    })

    it('returns children for the node', () => {
      g.setParent('a', 'parent')
      g.setParent('b', 'parent')
      expect(_.sortBy(g.children('parent'))).toEqual(['a', 'b'])
    })

    it('returns all nodes without a parent when the parent is not set', () => {
      g.setNode('a')
      g.setNode('b')
      g.setNode('c')
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(_.sortBy(g.children())).toEqual(['b', 'c', 'parent'])
      expect(_.sortBy(g.children(undefined))).toEqual(['b', 'c', 'parent'])
    })
  })

  describe('predecessors', () => {
    it('returns undefined for a node that is not in the graph', () => {
      expect(g.predecessors('a')).toEqual(undefined)
    })

    it('returns the predecessors of a node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect(_.sortBy(g.predecessors('a'))).toEqual(['a'])
      expect(_.sortBy(g.predecessors('b'))).toEqual(['a'])
      expect(_.sortBy(g.predecessors('c'))).toEqual(['b'])
    })
  })

  describe('successors', () => {
    it('returns undefined for a node that is not in the graph', () => {
      expect(g.successors('a')).toEqual(undefined)
    })

    it('returns the successors of a node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect(_.sortBy(g.successors('a'))).toEqual(['a', 'b'])
      expect(_.sortBy(g.successors('b'))).toEqual(['c'])
      expect(_.sortBy(g.successors('c'))).toEqual([])
    })
  })

  describe('neighbors', () => {
    it('returns undefined for a node that is not in the graph', () => {
      expect(g.neighbors('a')).toEqual(undefined)
    })

    it('returns the neighbors of a node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect(_.sortBy(g.neighbors('a'))).toEqual(['a', 'b'])
      expect(_.sortBy(g.neighbors('b'))).toEqual(['a', 'c'])
      expect(_.sortBy(g.neighbors('c'))).toEqual(['b'])
    })
  })

  describe('isLeaf', () => {
    it('returns false for connected node in undirected graph', () => {
      g = new Graph({directed: false})
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.isLeaf('b')).toEqual(false)
    })
    it('returns true for an unconnected node in undirected graph', () => {
      g = new Graph({directed: false})
      g.setNode('a')
      expect(g.isLeaf('a')).toEqual(true)
    })
    it('returns true for unconnected node in directed graph', () => {
      g.setNode('a')
      expect(g.isLeaf('a')).toEqual(true)
    })
    it('returns false for predecessor node in directed graph', () => {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.isLeaf('a')).toEqual(false)
    })
    it('returns true for successor node in directed graph', () => {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.isLeaf('b')).toEqual(true)
    })
  })

  describe('edges', () => {
    it('is empty if there are no edges in the graph', () => {
      expect(g.edges()).toEqual([])
    })

    it('returns the keys for edges in the graph', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(_.sortBy(g.edges()), ['v', 'w']).toEqual([
        {v: 'a', w: 'b'},
        {v: 'b', w: 'c'},
      ])
    })
  })

  describe('setPath', () => {
    it('creates a path of mutiple edges', () => {
      g.setPath(['a', 'b', 'c'])
      expect(g.hasEdge('a', 'b')).toEqual(true)
      expect(g.hasEdge('b', 'c')).toEqual(true)
    })

    it('can set a value for all of the edges', () => {
      g.setPath(['a', 'b', 'c'], 'foo')
      expect(g.edge('a', 'b')).toEqual('foo')
      expect(g.edge('b', 'c')).toEqual('foo')
    })

    it('is chainable', () => {
      expect(g.setPath(['a', 'b', 'c'])).toEqual(g)
    })
  })

  describe('setEdge', () => {
    it('creates the edge if it isn\'t part of the graph', () => {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).toEqual(undefined)
      expect(g.hasEdge('a', 'b')).toEqual(true)
      expect(g.hasEdge({v: 'a', w: 'b'})).toEqual(true)
      expect(g.edgeCount()).toEqual(1)
    })

    it('creates the nodes for the edge if they are not part of the graph', () => {
      g.setEdge('a', 'b')
      expect(g.hasNode('a')).toEqual(true)
      expect(g.hasNode('b')).toEqual(true)
      expect(g.nodeCount()).toEqual(2)
    })

    it('creates a multi-edge if if it isn\'t part of the graph', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b', undefined, 'name')
      expect(g.hasEdge('a', 'b')).toEqual(false)
      expect(g.hasEdge('a', 'b', 'name')).toEqual(true)
    })

    it('throws if a multi-edge is used with a non-multigraph', () => {
      expect(() => { g.setEdge('a', 'b', undefined, 'name') }).toThrow()
    })

    it('changes the value for an edge if it is already in the graph', () => {
      g.setEdge('a', 'b', 'foo')
      g.setEdge('a', 'b', 'bar')
      expect(g.edge('a', 'b')).toEqual('bar')
    })

    it('deletes the value for the edge if the value arg is undefined', () => {
      g.setEdge('a', 'b', 'foo')
      g.setEdge('a', 'b', undefined)
      expect(g.edge('a', 'b')).toEqual(undefined)
      expect(g.hasEdge('a', 'b')).toEqual(true)
    })

    it('changes the value for a multi-edge if it is already in the graph', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b', 'value', 'name')
      g.setEdge('a', 'b', undefined, 'name')
      expect(g.edge('a', 'b', 'name')).toEqual(undefined)
      expect(g.hasEdge('a', 'b', 'name')).toEqual(true)
    })

    it('can take an edge object as the first parameter', () => {
      g.setEdge({v: 'a', w: 'b'}, 'value')
      expect(g.edge('a', 'b')).toEqual('value')
    })

    it('can take an multi-edge object as the first parameter', () => {
      const g = new Graph({multigraph: true})
      g.setEdge({v: 'a', w: 'b', name: 'name'}, 'value')
      expect(g.edge('a', 'b', 'name')).toEqual('value')
    })

    it('uses the stringified form of the id #1', () => {
      g.setEdge(1, 2, 'foo')
      expect(g.edges()).toEqual([{v: '1', w: '2'}])
      expect(g.edge('1', '2')).toEqual('foo')
      expect(g.edge(1, 2)).toEqual('foo')
    })

    it('uses the stringified form of the id #2', () => {
      g = new Graph({multigraph: true})
      g.setEdge(1, 2, 'foo', undefined)
      expect(g.edges()).toEqual([{v: '1', w: '2'}])
      expect(g.edge('1', '2')).toEqual('foo')
      expect(g.edge(1, 2)).toEqual('foo')
    })

    it('uses the stringified form of the id with a name', () => {
      g = new Graph({multigraph: true})
      g.setEdge(1, 2, 'foo', 3)
      expect(g.edge('1', '2', '3')).toEqual('foo')
      expect(g.edge(1, 2, 3)).toEqual('foo')
      expect(g.edges()).toEqual([{v: '1', w: '2', name: '3'}])
    })

    it('treats edges in opposite directions as distinct in a digraph', () => {
      g.setEdge('a', 'b')
      expect(g.hasEdge('a', 'b')).toEqual(true)
      expect(g.hasEdge('b', 'a')).toEqual(false)
    })

    it('handles undirected graph edges', () => {
      const g = new Graph({directed: false})
      g.setEdge('a', 'b', 'foo')
      expect(g.edge('a', 'b')).toEqual('foo')
      expect(g.edge('b', 'a')).toEqual('foo')
    })

    it('handles undirected edges where id has different order than Stringified id', () => {
      const g = new Graph({directed: false})
      g.setEdge(9, 10, 'foo')
      expect(g.hasEdge('9', '10')).toEqual(true)
      expect(g.hasEdge(9, 10)).toEqual(true)
      expect(g.hasEdge('10', '9')).toEqual(true)
      expect(g.hasEdge(10, 9)).toEqual(true)
      expect(g.edge('9', '10')).toEqual('foo')
      expect(g.edge(9, 10)).toEqual('foo')
    })

    it('is chainable', () => {
      expect(g.setEdge('a', 'b')).toEqual(g)
    })
  })

  describe('setDefaultEdgeLabel', () => {
    it('sets a default label for new edges', () => {
      g.setDefaultEdgeLabel('foo')
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).toEqual('foo')
    })

    it('does not change existing edges', () => {
      g.setEdge('a', 'b')
      g.setDefaultEdgeLabel('foo')
      expect(g.edge('a', 'b')).toEqual(undefined)
    })

    it('is not used if an explicit value is set', () => {
      g.setDefaultEdgeLabel('foo')
      g.setEdge('a', 'b', 'bar')
      expect(g.edge('a', 'b')).toEqual('bar')
    })

    it('can take a function', () => {
      g.setDefaultEdgeLabel(() => 'foo')
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).toEqual('foo')
    })

    it('can take a function that takes the edge\'s endpoints and name', () => {
      const g = new Graph({multigraph: true})
      g.setDefaultEdgeLabel((v, w, name) => `${v}-${w}-${name}-foo`)
      g.setEdge({v: 'a', w: 'b', name: 'name'})
      expect(g.edge('a', 'b', 'name')).toEqual('a-b-name-foo')
    })

    it('does not set a default value for a multi-edge that already exists', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b', 'old', 'name')
      g.setDefaultEdgeLabel(() => 'should not set this')
      g.setEdge({v: 'a', w: 'b', name: 'name'})
      expect(g.edge('a', 'b', 'name')).toEqual('old')
    })

    it('is chainable', () => {
      expect(g.setDefaultEdgeLabel('foo')).toEqual(g)
    })
  })

  describe('edge', () => {
    it('returns undefined if the edge isn\'t part of the graph', () => {
      expect(g.edge('a', 'b')).toEqual(undefined)
      expect(g.edge({v: 'a', w: 'b'})).toEqual(undefined)
      expect(g.edge('a', 'b', 'foo')).toEqual(undefined)
    })

    it('returns the value of the edge if it is part of the graph', () => {
      g.setEdge('a', 'b', {foo: 'bar'})
      expect(g.edge('a', 'b')).toEqual({foo: 'bar'})
      expect(g.edge({v: 'a', w: 'b'})).toEqual({foo: 'bar'})
      expect(g.edge('b', 'a')).toEqual(undefined)
    })

    it('returns the value of a multi-edge if it is part of the graph', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b', {bar: 'baz'}, 'foo')
      expect(g.edge('a', 'b', 'foo')).toEqual({bar: 'baz'})
      expect(g.edge('a', 'b')).toEqual(undefined)
    })

    it('returns an edge in either direction in an undirected graph', () => {
      const g = new Graph({directed: false})
      g.setEdge('a', 'b', {foo: 'bar'})
      expect(g.edge('a', 'b')).toEqual({foo: 'bar'})
      expect(g.edge('b', 'a')).toEqual({foo: 'bar'})
    })
  })

  describe('removeEdge', () => {
    it('has no effect if the edge is not in the graph', () => {
      g.removeEdge('a', 'b')
      expect(g.hasEdge('a', 'b')).toEqual(false)
      expect(g.edgeCount()).toEqual(0)
    })

    it('can remove an edge by edgeObj', () => {
      const g = new Graph({multigraph: true})
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.removeEdge({v: 'a', w: 'b', name: 'foo'})
      expect(g.hasEdge('a', 'b', 'foo')).toEqual(false)
      expect(g.edgeCount()).toEqual(0)
    })

    it('can remove an edge by separate ids', () => {
      const g = new Graph({multigraph: true})
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.removeEdge('a', 'b', 'foo')
      expect(g.hasEdge('a', 'b', 'foo')).toEqual(false)
      expect(g.edgeCount()).toEqual(0)
    })

    it('correctly removes neighbors', () => {
      g.setEdge('a', 'b')
      g.removeEdge('a', 'b')
      expect(g.successors('a')).toEqual([])
      expect(g.neighbors('a')).toEqual([])
      expect(g.predecessors('b')).toEqual([])
      expect(g.neighbors('b')).toEqual([])
    })

    it('correctly decrements neighbor counts', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.removeEdge('a', 'b')
      expect(g.hasEdge('a', 'b', 'foo'))
      expect(g.successors('a')).toEqual(['b'])
      expect(g.neighbors('a')).toEqual(['b'])
      expect(g.predecessors('b')).toEqual(['a'])
      expect(g.neighbors('b')).toEqual(['a'])
    })

    it('works with undirected graphs', () => {
      const g = new Graph({directed: false})
      g.setEdge('h', 'g')
      g.removeEdge('g', 'h')
      expect(g.neighbors('g')).toEqual([])
      expect(g.neighbors('h')).toEqual([])
    })

    it('is chainable', () => {
      g.setEdge('a', 'b')
      expect(g.removeEdge('a', 'b')).toEqual(g)
    })
  })

  describe('inEdges', () => {
    it('returns undefined for a node that is not in the graph', () => {
      expect(g.inEdges('a')).toEqual(undefined)
    })

    it('returns the edges that point at the specified node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(g.inEdges('a')).toEqual([])
      expect(g.inEdges('b')).toEqual([{v: 'a', w: 'b'}])
      expect(g.inEdges('c')).toEqual([{v: 'b', w: 'c'}])
    })

    it('works for multigraphs', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect(g.inEdges('a')).toEqual([])
      expect(_.sortBy(g.inEdges('b'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
    })

    it('can return only edges from a specified node', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect(g.inEdges('a', 'b')).toEqual([])
      expect(_.sortBy(g.inEdges('b', 'a'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
    })
  })

  describe('outEdges', () => {
    it('returns undefined for a node that is not in the graph', () => {
      expect(g.outEdges('a')).toEqual(undefined)
    })

    it('returns all edges that this node points at', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(g.outEdges('a')).toEqual([{v: 'a', w: 'b'}])
      expect(g.outEdges('b')).toEqual([{v: 'b', w: 'c'}])
      expect(g.outEdges('c')).toEqual([])
    })

    it('works for multigraphs', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect(_.sortBy(g.outEdges('a'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
      expect(g.outEdges('b')).toEqual([])
    })

    it('can return only edges to a specified node', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect(_.sortBy(g.outEdges('a', 'b'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
      expect(g.outEdges('b', 'a')).toEqual([])
    })
  })

  describe('nodeEdges', () => {
    it('returns undefined for a node that is not in the graph', () => {
      expect(g.nodeEdges('a')).toEqual(undefined)
    })

    it('returns all edges that this node points at', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(g.nodeEdges('a')).toEqual([{v: 'a', w: 'b'}])
      expect(_.sortBy(g.nodeEdges('b'), ['v', 'w']))
        .toEqual([{v: 'a', w: 'b'}, {v: 'b', w: 'c'}])
      expect(g.nodeEdges('c')).toEqual([{v: 'b', w: 'c'}])
    })

    it('works for multigraphs', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge({v: 'a', w: 'b', name: 'bar'})
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      expect(_.sortBy(g.nodeEdges('a'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
      expect(_.sortBy(g.nodeEdges('b'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
    })

    it('can return only edges between specific nodes', () => {
      const g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect(_.sortBy(g.nodeEdges('a', 'b'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
      expect(_.sortBy(g.nodeEdges('b', 'a'), 'name')).toEqual([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'},
      ])
    })
  })
})
