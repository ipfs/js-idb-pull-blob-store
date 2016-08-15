/* eslint-env mocha*/
'use strict'

const expect = require('chai').expect
const pull = require('pull-stream')

const IdbBlobStore = require('../src')
const indexedDB = window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB

describe('streaming', () => {
  let store

  beforeEach(() => {
    store = new IdbBlobStore('test')
  })

  afterEach(() => {
    store.db.close()
    indexedDB.deleteDatabase(store.path)
  })

  it('buffers values on write', (done) => {
    bufferTest(store, 100, 1, done)
  })

  it('buffers values on write, splits into chunks of 100', (done) => {
    bufferTest(store, 350, 4, done)
  })
})

function bufferTest (store, inputCount, outputCount, done) {
  pull(
    pull.infinite(() => 'a'),
    pull.take(inputCount),
    store.write('buffered', (err) => {
      expect(err).to.not.exist
      store.table
        .where('key')
        .equals('buffered')
        .count()
        .then((count) => {
          expect(count).to.be.eql(outputCount)
          done()
        })
        .catch(done)
    })
  )
}
