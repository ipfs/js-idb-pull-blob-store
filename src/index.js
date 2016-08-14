'use strict'

const Dexie = require('dexie')
const write = require('pull-write')
const pushable = require('pull-pushable')
const toBuffer = require('typedarray-to-buffer')

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
    this.table = this.db[this.path]
  }

  write (key, cb) {
    cb = cb || (() => {})

    return write((data, cb) => {
      const blobs = data.map((blob) => ({
        key,
        blob
      }))

      this.table.bulkPut(blobs)
        .then(() => cb())
        .catch(cb)
    }, null, 100, cb)
  }

  read (key) {
    const p = pushable()

    this.table
      .where('key').equals(key)
      .each((val) => p.push(toBuffer(val.blob)))
      .then(() => p.end())
      .catch((err) => p.end(err))

    return p
  }

  exists (key, cb) {
    cb = cb || (() => {})

    this.table
      .where('key').equals(key)
      .count()
      .then((val) => cb(null, Boolean(val)))
      .catch(cb)
  }

  remove (key, cb) {
    cb = cb || (() => {})

    this.table
      .where('key').equals(key)
      .delete()
      .then(() => cb())
      .catch(cb)
  }
}
