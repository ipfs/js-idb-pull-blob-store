'use strict'

const testSuite = require('interface-pull-blob-store/lib/tests')

const IdbBlobStore = require('../src')
const indexedDB = self.indexedDB ||
        self.mozIndexedDB ||
        self.webkitIndexedDB ||
        self.msIndexedDB

testSuite({
  setup (cb) {
    cb(null, new IdbBlobStore('test'))
  },
  teardown (store, cb) {
    store.db.close()
    indexedDB.deleteDatabase(store.path)
    cb()
  }
})
