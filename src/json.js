// @flow
import * as _ from 'lodash'
import { Graph } from './graph'


interface ISerializedNode {
  v: string,
  value: any,
  parent: string
}

interface ISerializedEdge {
  v: string,
  w: string,
  name: string,
  value: any
}

interface ISerializedGraph {
  options: {
    directed: boolean,
    multigraph: boolean,
    compound: boolean
  },
  nodes: ISerializedNode[],
  edges: ISerializedEdge[],
  value: any
}

export function write (g: Graph): ISerializedGraph {
  const json = {
    options: {
      directed: g.isDirected,
      multigraph: g.isMultigraph,
      compound: g.isCompound
    },
    nodes: writeNodes(g),
    edges: writeEdges(g)
  }
  if (!_.isUndefined(g.graph())) {
    json.value = _.clone(g.graph())
  }
  return json
}

function writeNodes (g) {
  return _.map(g.nodes(), function (v) {
    const nodeValue = g.node(v)
    const parent = g.parent(v)
    return {
      v: v,
      value: nodeValue,
      parent
    }
  })
}

function writeEdges (g) {
  return _.map(g.edges(), function (e) {
    const edgeValue = g.edge(e)
    return {
      v: e.v,
      w: e.w,
      name: e.name,
      value: edgeValue
    }
  })
}

export function read (json: ISerializedGraph): Graph {
  const g = new Graph(json.options).setGraph(json.value)
  _.each(json.nodes, function (entry) {
    g.setNode(entry.v, entry.value)
    if (entry.parent) {
      g.setParent(entry.v, entry.parent)
    }
  })
  _.each(json.edges, function (entry) {
    g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value)
  })
  return g
}
