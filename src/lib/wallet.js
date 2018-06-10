const {randomBytes} = require('crypto')
const secp256k1 = require('secp256k1')
const bs58 = require('bs58')

/**
 * Generate key pair
 *
 * @return {{private: string, public: string}}
 */
function generateKeyPair () {
  // Generate private key
  let privKey
  do {
    privKey = randomBytes(32)
  } while (! secp256k1.privateKeyVerify(privKey))
  // Generate public key
  const pubKey = secp256k1.publicKeyCreate(privKey)

  return {
    private: privKey.toString('hex'),
    // Base58 format for public key, public key plays address role
    public: bs58.encode(pubKey),
  }
}

/**
 * Sign hex hash
 *
 * @param {string} privateKey
 * @param {string} hash
 * @return {string}
 */
function signHash (privateKey, hash) {
  return secp256k1.sign(Buffer.from(hash, 'hex'), Buffer.from(privateKey, 'hex')).signature.toString('base64')
}

/**
 * Verify hex hash signature
 *
 * @param {string} address
 * @param {string} signature
 * @param {string} hash
 * @return {bool}
 */
function verifySignature (address, signature, hash) {
  return secp256k1.verify(Buffer.from(hash, 'hex'), Buffer.from(signature, 'base64'), bs58.decode(address))
}

module.exports = {generateKeyPair, signHash, verifySignature}
