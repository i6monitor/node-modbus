/**
 * Modbus server read holding registers.
 * @module ModbusServerReadHoldingRegisters
 */
'use strict'

let stampit = require('stampit')

module.exports = stampit()
  .init(function () {
    let init = function () {
      this.log.debug('initiating read holding registers request handler.')

      if (!this.responseDelay) {
        this.responseDelay = 0
      }

      this.setRequestHandler(3, onRequest)
    }.bind(this)

    let onRequest = function (pdu, cb) {
      setTimeout(function () {
        this.log.debug('handling read holding registers request.')

        if (pdu.length !== 5) {
          this.log.debug('wrong pdu length.')

          let buf = Buffer.allocUnsafe(2)

          buf.writeUInt8(0x83, 0)
          buf.writeUInt8(0x02, 1)
          cb(buf)

          return
        }

        let start = pdu.readUInt16BE(1)
        let byteStart = start * 2
        let quantity = pdu.readUInt16BE(3)

        this.emit('readHoldingRegistersRequest', byteStart, quantity)

        let mem = this.getHolding()

        if (byteStart > mem.length || byteStart + (quantity * 2) > mem.length) {
          this.log.debug('request outside register boundaries.')
          let buf = Buffer.allocUnsafe(2)

          buf.writeUInt8(0x83, 0)
          buf.writeUInt8(0x02, 1)
          cb(buf)
          return
        }

        let head = Buffer.allocUnsafe(2)

        head.writeUInt8(0x03, 0)
        head.writeUInt8(quantity * 2, 1)

        let response = Buffer.concat([head, mem.slice(byteStart, byteStart + quantity * 2)])

        this.log.debug('finished read holding register request.')

        cb(response)
      }.bind(this), this.responseDelay)
    }.bind(this)

    init()
  })
