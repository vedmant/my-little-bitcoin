const {randomBytes} = require('crypto')
const secp256k1 = require('secp256k1')
const bs58 = require('bs58')

function generateKeyPair () {
  // Generate privKey
  let privKey
  do {
    privKey = randomBytes(32)
  } while (! secp256k1.privateKeyVerify(privKey))
  // Get the public key in a compressed format
  const pubKey = secp256k1.publicKeyCreate(privKey)

  return {
    private: privKey.toString('hex'),
    public: bs58.encode(pubKey),
  }
}

function signHash (privateKey, hash) {
  return secp256k1.sign(Buffer.from(hash, 'hex'), Buffer.from(privateKey, 'hex')).signature.toString('base64')
}

function verifySignature (address, signature, hash) {
  return secp256k1.verify(Buffer.from(hash, 'hex'), Buffer.from(signature, 'base64'), bs58.decode(address))
}

module.exports = {generateKeyPair, signHash, verifySignature}
