// @flow
import * as _ from 'lodash'

const DEFAULT_EDGE_NAME = '\x00'
const GRAPH_NODE = '\x00'
const EDGE_KEY_DELIM = '\x01'

// Implementation notes:
//
//  * Node id query functions should return string ids for the nodes
//  * Edge id query functions should return an "edgeObj", edge object, that is
//    composed of enough information to uniquely identify an edge: {v, w, name}.
//  * Internally we use an "edgeId", a stringified form of the edgeObj, to
//    reference edges. This is because we need a performant way to look these
//    edges up and, object properties, which have string keys, are the closest
//    we're going to get to a performant hashtable in JavaScript.

interface IGraphInit {
  directed: boolean,
  multigraph: boolean,
  compound: boolean
}

type IGraph = {} & (
  | {
  isDirected: true,
  _parent: { [string]: string }, // v -> parent
  _children: { [string]: string } // v -> children
} | {
  isDirected: false,
})

export class Graph implements IGraph {
  _defaultNodeLabelFn: () => number = _.constant(undefined)
  _defaultEdgeLabelFn: () => number = _.constant(undefined)

  _label: any = undefined

  _nodeCount: number = 0
  _edgeCount: number = 0

  _nodes = {} // v -> label

  _in = {} // v -> edgeObj

  _preds = {} // u -> v -> Number

  _out = {} // v -> edgeObj

  _sucs = {} // v -> w -> Number

  _edgeObjs = {} // e -> edgeObj

  _edgeLabels = {} // e -> label

  isDirected: boolean
  isMultigraph: boolean
  isCompound: boolean

  constructor ({directed = true, multigraph = false, compound = false}: IGraphInit = {}) {
    Object.defineProperties(this, {
      isDirected: {value: directed},
      isMultigraph: {value: multigraph},
      isCompound: {value: compound}
    })

    if (this.isCompound) {
      this._parent = {}
      this._children = {}
      this._children[GRAPH_NODE] = {}
    }
  }

  /* === Graph functions ========= */

  setGraph (label) {
    this._label = label
    return this
  }

  graph () {
    return this._label
  }

  /* === Node functions ========== */

  setDefaultNodeLabel (newDefault) {
    if (!_.isFunction(newDefault)) {
      newDefault = _.constant(newDefault)
    }
    this._defaultNodeLabelFn = newDefault
    return this
  }

  nodeCount () {
    return this._nodeCount
  }

  nodes () {
    return _.keys(this._nodes)
  }

  sources () {
    return _.filter(this.nodes(), _.bind(function (v) {
      return _.isEmpty(this._in[v])
    }, this))
  }

  sinks () {
    return _.filter(this.nodes(), _.bind(function (v) {
      return _.isEmpty(this._out[v])
    }, this))
  }

  setNodes (vs, value) {
    const args = arguments
    _.each(vs, _.bind(function (v) {
      if (args.length > 1) {
        this.setNode(v, value)
      } else {
        this.setNode(v)
      }
    }, this))
    return this
  }

  setNode (v, value) {
    if (_.has(this._nodes, v)) {
      if (arguments.length > 1) {
        this._nodes[v] = value
      }
      return this
    }

    this._nodes[v] = arguments.length > 1 ? value : this._defaultNodeLabelFn(v)
    if (this.isCompound) {
      this._parent[v] = GRAPH_NODE
      this._children[v] = {}
      this._children[GRAPH_NODE][v] = true
    }
    this._in[v] = {}
    this._preds[v] = {}
    this._out[v] = {}
    this._sucs[v] = {}
    ++this._nodeCount
    return this
  }

  node (v) {
    return this._nodes[v]
  }

  hasNode (v) {
    return _.has(this._nodes, v)
  }

  removeNode (v) {
    const self = this
    if (_.has(this._nodes, v)) {
      const removeEdge = e => { self.removeEdge(self._edgeObjs[e]) }
      delete this._nodes[v]
      if (this.isCompound) {
        this._removeFromParentsChildList(v)
        delete this._parent[v]
        _.each(this.children(v), _.bind(function (child) {
          this.setParent(child)
        }, this))
        delete this._children[v]
      }
      _.each(_.keys(this._in[v]), removeEdge)
      delete this._in[v]
      delete this._preds[v]
      _.each(_.keys(this._out[v]), removeEdge)
      delete this._out[v]
      delete this._sucs[v]
      --this._nodeCount
    }
    return this
  }

  setParent (v: string, _parent: any) {
    if (!this.isCompound) {
      throw new Error('Cannot set parent in a non-compound graph')
    }

    let parent: string

    if (_.isUndefined(_parent)) {
      parent = GRAPH_NODE
    } else {
      // Coerce parent to string
      parent = _parent + ''
      for (let ancestor = parent;
        !_.isUndefined(ancestor);
        ancestor = this.parent(ancestor)) {
        if (ancestor === v) {
          throw new Error(`Setting ${parent} as parent of ${v} would create create a cycle`)
        }
      }

      this.setNode(parent)
    }

    this.setNode(v)
    this._removeFromParentsChildList(v)
    this._parent[v] = parent
    this._children[parent][v] = true
    return this
  }

  _removeFromParentsChildList (v) {
    delete this._children[this._parent[v]][v]
  }

  parent (v: string) {
    if (this.isCompound) {
      const parent = this._parent[v]
      if (parent !== GRAPH_NODE) {
        return parent
      }
    }
  }

  children (v?: string) {
    if (_.isUndefined(v)) {
      v = GRAPH_NODE
    }

    if (this.isCompound) {
      const children = this._children[v]
      if (children) {
        return _.keys(children)
      }
    } else if (v === GRAPH_NODE) {
      return this.nodes()
    } else if (this.hasNode(v)) {
      return []
    }
  }

  predecessors (v: string) {
    const predsV = this._preds[v]
    if (predsV) {
      return _.keys(predsV)
    }
  }

  successors (v: string) {
    const sucsV = this._sucs[v]
    if (sucsV) {
      return _.keys(sucsV)
    }
  }

  neighbors (v: string) {
    const preds = this.predecessors(v)
    if (preds) {
      return _.union(preds, this.successors(v))
    }
  }

  isLeaf (v: string): number {
    let neighbors
    if (this.isDirected) {
      neighbors = this.successors(v)
    } else {
      neighbors = this.neighbors(v)
    }
    return neighbors.length === 0
  }

  filterNodes (filter: (node: string) => boolean) {
    const copy = new this.constructor({
      directed: this.isDirected,
      multigraph: this.isMultigraph,
      compound: this.isCompound
    })

    copy.setGraph(this.graph())

    _.each(this._nodes, _.bind((value, v) => {
      if (filter(v)) {
        copy.setNode(v, value)
      }
    }, this))

    _.each(this._edgeObjs, _.bind(function (e) {
      if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
        copy.setEdge(e, this.edge(e))
      }
    }, this))

    const self = this
    const parents = {}

    function findParent (v) {
      const parent = self.parent(v)
      if (parent === undefined || copy.hasNode(parent)) {
        parents[v] = parent
        return parent
      } else if (parent in parents) {
        return parents[parent]
      } else {
        return findParent(parent)
      }
    }

    if (this.isCompound) {
      _.each(copy.nodes(), v => {
        copy.setParent(v, findParent(v))
      })
    }

    return copy
  }

  /* === Edge functions ========== */

  setDefaultEdgeLabel (newDefault) {
    if (!_.isFunction(newDefault)) {
      newDefault = _.constant(newDefault)
    }
    this._defaultEdgeLabelFn = newDefault
    return this
  }

  edgeCount () {
    return this._edgeCount
  }

  edges () {
    return _.values(this._edgeObjs)
  }

  setPath (vs, value) {
    const self = this
    const args = arguments
    _.reduce(vs, (v, w) => {
      if (args.length > 1) {
        self.setEdge(v, w, value)
      } else {
        self.setEdge(v, w)
      }
      return w
    })
    return this
  }

  /*
   * setEdge(v, w, [value, [name]])
   * setEdge({ v, w, [name] }, [value])
   */
  setEdge (...args) {
    let v
    let w
    let name
    let value
    let valueSpecified = false
    const arg0 = args[0]

    if (typeof arg0 === 'object' && arg0 !== null && 'v' in arg0) {
      v = arg0.v
      w = arg0.w
      name = arg0.name
      if (args.length === 2) {
        value = args[1]
        valueSpecified = true
      }
    } else {
      v = arg0
      w = args[1]
      name = args[3]
      if (args.length > 2) {
        value = args[2]
        valueSpecified = true
      }
    }

    v = `${v}`
    w = `${w}`
    if (!_.isUndefined(name)) {
      name = `${name}`
    }

    const e = edgeArgsToId(this.isDirected, v, w, name)
    if (_.has(this._edgeLabels, e)) {
      if (valueSpecified) {
        this._edgeLabels[e] = value
      }
      return this
    }

    if (!_.isUndefined(name) && !this.isMultigraph) {
      throw new Error('Cannot set a named edge when isMultigraph = false')
    }

    // It didn't exist, so we need to create it.
    // First ensure the nodes exist.
    this.setNode(v)
    this.setNode(w)

    this._edgeLabels[e] = valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name)

    const edgeObj = edgeArgsToObj(this.isDirected, v, w, name)
    // Ensure we add undirected edges in a consistent way.
    v = edgeObj.v
    w = edgeObj.w

    Object.freeze(edgeObj)
    this._edgeObjs[e] = edgeObj
    incrementOrInitEntry(this._preds[w], v)
    incrementOrInitEntry(this._sucs[v], w)
    this._in[w][e] = edgeObj
    this._out[v][e] = edgeObj
    this._edgeCount++
    return this
  }

  edge (v, w, name) {
    const e = (arguments.length === 1
      ? edgeObjToId(this.isDirected, arguments[0])
      : edgeArgsToId(this.isDirected, v, w, name))
    return this._edgeLabels[e]
  }

  hasEdge (v, w, name) {
    const e = (arguments.length === 1
      ? edgeObjToId(this.isDirected, arguments[0])
      : edgeArgsToId(this.isDirected, v, w, name))
    return _.has(this._edgeLabels, e)
  }

  removeEdge (v, w, name) {
    const e = (arguments.length === 1
      ? edgeObjToId(this.isDirected, arguments[0])
      : edgeArgsToId(this.isDirected, v, w, name))

    const edge = this._edgeObjs[e]
    if (edge) {
      v = edge.v
      w = edge.w
      delete this._edgeLabels[e]
      delete this._edgeObjs[e]
      decrementOrRemoveEntry(this._preds[w], v)
      decrementOrRemoveEntry(this._sucs[v], w)
      delete this._in[w][e]
      delete this._out[v][e]
      this._edgeCount--
    }
    return this
  }

  inEdges (v, u) {
    const inV = this._in[v]
    if (inV) {
      const edges = _.values(inV)
      if (!u) {
        return edges
      }
      return _.filter(edges, edge => edge.v === u)
    }
  }

  outEdges (v, w) {
    const outV = this._out[v]
    if (outV) {
      const edges = _.values(outV)
      if (!w) {
        return edges
      }
      return _.filter(edges, edge => edge.w === w)
    }
  }

  nodeEdges (v, w) {
    const inEdges = this.inEdges(v, w)
    if (inEdges) {
      return inEdges.concat(this.outEdges(v, w))
    }
  }
}

function incrementOrInitEntry (map, k) {
  if (map[k]) {
    map[k]++
  } else {
    map[k] = 1
  }
}

function decrementOrRemoveEntry (map, k) {
  if (!--map[k]) { delete map[k] }
}

function edgeArgsToId (isDirected, v_, w_, name) {
  let v = `${v_}`
  let w = `${w_}`
  if (!isDirected && v > w) {
    const tmp = v
    v = w
    w = tmp
  }
  return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM +
    (_.isUndefined(name) ? DEFAULT_EDGE_NAME : name)
}

function edgeArgsToObj (isDirected, v_, w_, name) {
  let v = `${v_}`
  let w = `${w_}`
  if (!isDirected && v > w) {
    const tmp = v
    v = w
    w = tmp
  }
  const edgeObj = {v, w}
  if (name) {
    edgeObj.name = name
  }
  return edgeObj
}

function edgeObjToId (isDirected, {v, w, name}) {
  return edgeArgsToId(isDirected, v, w, name)
}
