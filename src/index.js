'use strict'

const Dexie = require('dexie')
const write = require('pull-write')
const pushable = require('pull-pushable')
const toBuffer = require('typedarray-to-buffer')
const defer = require('pull-defer/sink')

module.exports = class IdbBlobStore {
  constructor (dbname) {
    this.path = dbname || `pull-blob-store-${Math.random().toString().slice(2, 10)}`

    this.db = new Dexie(this.path)

    // Setup database
    this.db
      .version(1)
      .stores({
        [this.path]: '++,key,blob'
      })
  }

  get table () {
    return this.db[this.path]
  }

  write (key, cb) {
    cb = cb || (() => {})
    const d = defer()

    if (!key) {
      cb(new Error('Missing key'))

      return d
    }

    this.remove(key, (err) => {
      if (err) {
        return cb(err)
      }

      d.resolve(write((data, cb) => {
        const blobs = data.map((blob) => ({
          key,
          blob
        }))

        this.table.bulkPut(blobs)
          .then(() => cb())
          .catch(cb)
      }, null, 100, cb))
    })

    return d
  }

  read (key) {
    const p = pushable()

    if (!key) {
      p.end(new Error('Missing key'))

      return p
    }

    this.table
      .where('key').equals(key)
      .each((val) => p.push(toBuffer(val.blob)))
      .then(() => p.end())
      .catch((err) => p.end(err))

    return p
  }

  exists (key, cb) {
    cb = cb || (() => {})

    if (!key) {
      return cb(new Error('Missing key'))
    }

    this.table
      .where('key').equals(key)
      .count()
      .then((val) => cb(null, Boolean(val)))
      .catch(cb)
  }

  remove (key, cb) {
    cb = cb || (() => {})

    if (!key) {
      return cb(new Error('Missing key'))
    }

    const coll = this.table.where('key').equals(key)
    coll
      .count((count) => count > 0 ? coll.delete() : null)
      .then(() => cb())
      .catch(cb)
  }
}
