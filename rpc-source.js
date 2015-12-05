require('array.prototype.find')
require('es6-promise').polyfill()
require('isomorphic-fetch')
const Transaction = require('ethereumjs-tx')
const async = require('async')
const request = require('request')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const RemoteDataSource = require('./remote-data.js')


module.exports = RpcSource

inherits(RpcSource, RemoteDataSource)

function RpcSource(opts){
  const self = this
  self.rpcUrl = opts.rpcUrl
  RemoteDataSource.call(self)
}

RpcSource.prototype._handleAsync = function(payload, cb){
  const self = this
  self.requestFromRpc(payload.method, payload.params, cb)
}

// RpcSource.prototype._fetchAccount = function(address, block, cb){
//   const self = this
//   async.parallel([
//     self._fetchAccountBalance.bind(self, address, block),
//     self._fetchAccountNonce.bind(self, address, block),
//     self._fetchAccountCode.bind(self, address, block),
//   ], function(err, results){
//     if (err) return cb(err)

//     console.log(block, 'results:', results)
//     var account = {
//       balance: results[0],
//       nonce: results[1],
//       code: results[2],
//     }

//     cb(null, account)
//   })

// }

// RpcSource.prototype._fetchAccountStorage = function(address, key, block, cb){
//   const self = this
//   self.requestFromRpc('eth_getStorageAt', [address, key, block], cb)
// }

// RpcSource.prototype._fetchAccountBalance = function(address, block, cb){
//   const self = this
//   self.requestFromRpc('eth_getBalance', [address, block], cb)
// }

// RpcSource.prototype._fetchAccountNonce = function(address, block, cb){
//   const self = this
//   self.requestFromRpc('eth_getTransactionCount', [address, block], cb)
// }

// RpcSource.prototype._fetchAccountCode = function(address, block, cb){
//   const self = this
//   self.requestFromRpc('eth_getCode', [address, block], cb)
// }


RpcSource.prototype.requestFromRpc = function(method, params, cb){
  const self = this
  var targetUrl = self.rpcUrl
  var payload = {
    id: getRandomId(),
    jsonrpc: '2.0',
    method: method,
    params: params,
  }
  // console.log('uri:', targetUrl)
  // console.log('method:', method)
  // console.log('params:', params)

  request({
    uri: targetUrl,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    rejectUnauthorized: false,
  }, function(err, res, body) {
    if (err) return cb(err)
    // parse response into raw account
    var data
    try {
      data = JSON.parse(body)
    } catch (err) {
      console.error(err.stack)
      return cb(err)
    }

    cb(null, data.result)
  })
  
}

// util

function getRandomId(){
  return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)
}

function materializeTransaction(data){
  var tx = new Transaction({
    nonce: data.nonce,
    gasPrice: data.gasPrice,
    gasLimit: data.gas,
    to: data.to,
    value: data.value,
    data: data.input,
  })
  tx.from = new Buffer(ethUtil.stripHexPrefix(data.from), 'hex')
  return tx
}