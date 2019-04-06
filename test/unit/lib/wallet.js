import {expect} from 'chai'
import CryptoJS from 'crypto-js'
import {generateKeyPair, signHash, verifySignature} from '../../../src/lib/wallet'

describe('wallet lib', () => {

  let wallet

  beforeEach(() => {
    wallet = generateKeyPair()
  })

  it('should generate key pair', () => {
    expect(generateKeyPair()).to.have.all.keys('private', 'public')
  })

  it('should sign hash', () => {
    expect(signHash(wallet.private, CryptoJS.SHA256('123').toString())).to.be.a('string')
  })

  it('should verify signature', () => {
    const hash = CryptoJS.SHA256('123').toString()
    const signature = signHash(wallet.private, hash)
    expect(verifySignature(wallet.public, signature, hash)).to.be.true
  })

  it('should not verify wrong signature', () => {
    const hash = CryptoJS.SHA256('123').toString()
    const signature = signHash(wallet.private, hash)
    expect(verifySignature(wallet.public, '0F' + signature.substring(2), hash)).to.be.false
  })

})
