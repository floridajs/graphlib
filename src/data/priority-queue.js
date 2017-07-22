//@flow
import * as _ from 'lodash'

/**
 * A min-priority queue data structure. This algorithm is derived from Cormen,
 * et al., "Introduction to Algorithms". The basic idea of a min-priority
 * queue is that you can efficiently (in O(1) time) get the smallest key in
 * the queue. Adding and removing elements takes O(log n) time. A key can
 * have its priority decreased in O(log n) time.
 */
export class PriorityQueue {
  _arr: {key: string, priority: number}[]
  _keyIndices: {[key: string]: number}

  constructor () {
    this._arr = []
    this._keyIndices = {}
  }

  /**
   * Returns the number of elements in the queue. Takes `O(1)` time.
   */
  size () {
    return this._arr.length
  }

  /**
   * Returns the keys that are in the queue. Takes `O(n)` time.
   */
  keys () {
    return this._arr.map(({key}) => key)
  }

  /**
   * Returns `true` if **key** is in the queue and `false` if not.
   */
  has (key) {
    return _.has(this._keyIndices, key)
  }

  /**
   * Returns the priority for **key**. If **key** is not present in the queue
   * then this function returns `undefined`. Takes `O(1)` time.
   *
   * @param {Object} key
   */
  priority (key) {
    const index = this._keyIndices[key]
    if (index !== undefined) {
      return this._arr[index].priority
    }
  }

  /**
   * Returns the key for the minimum element in this queue. If the queue is
   * empty this function throws an Error. Takes `O(1)` time.
   */
  min () {
    if (this.size() === 0) {
      throw new Error('Queue underflow')
    }
    return this._arr[0].key
  }

  /**
   * Inserts a new key into the priority queue. If the key already exists in
   * the queue this function returns `false`; otherwise it will return `true`.
   * Takes `O(n)` time.
   *
   * @param {Object} key the key to add
   * @param {Number} priority the initial priority for the key
   */
  add (key: string, priority: number) {
    const keyIndices = this._keyIndices
    key = String(key)
    if (!_.has(keyIndices, key)) {
      const arr = this._arr
      const index = arr.length
      keyIndices[key] = index
      arr.push({key, priority})
      this._decrease(index)
      return true
    }
    return false
  }

  /**
   * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
   */
  removeMin () {
    this._swap(0, this._arr.length - 1)
    const min = this._arr.pop()
    delete this._keyIndices[min.key]
    this._heapify(0)
    return min.key
  }

  /**
   * Decreases the priority for **key** to **priority**. If the new priority is
   * greater than the previous priority, this function will throw an Error.
   *
   * @param {Object} key the key for which to raise priority
   * @param {Number} priority the new priority for the key
   */
  decrease (key, priority) {
    const index = this._keyIndices[key]
    if (priority > this._arr[index].priority) {
      throw new Error(`New priority is greater than current priority. Key: ${key} Old: ${this._arr[index].priority} New: ${priority}`)
    }
    this._arr[index].priority = priority
    this._decrease(index)
  }

  _heapify (i: number) {
    const arr = this._arr
    const l = 2 * i
    const r = l + 1
    let largest = i
    if (l < arr.length) {
      largest = arr[l].priority < arr[largest].priority ? l : largest
      if (r < arr.length) {
        largest = arr[r].priority < arr[largest].priority ? r : largest
      }
      if (largest !== i) {
        this._swap(i, largest)
        this._heapify(largest)
      }
    }
  }

  _decrease (index) {
    const arr = this._arr
    const priority = arr[index].priority
    let parent
    while (index !== 0) {
      parent = index >> 1
      if (arr[parent].priority < priority) {
        break
      }
      this._swap(index, parent)
      index = parent
    }
  }

  _swap (i, j) {
    const arr = this._arr
    const keyIndices = this._keyIndices
    const origArrI = arr[i]
    const origArrJ = arr[j]
    arr[i] = origArrJ
    arr[j] = origArrI
    keyIndices[origArrJ.key] = i
    keyIndices[origArrI.key] = j
  }
}
