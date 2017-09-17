const fs = require('fs');
const crypto = require('crypto');
const elliptic = require('elliptic');
const EdDSA = elliptic.eddsa;
const ec = new EdDSA('ed25519');

function generateKeyPair () {
    const keyPair = ec.keyFromSecret(crypto.randomBytes(32));
    return {
        secret: keyPair.getSecret().toString('hex'),
        public: elliptic.utils.toHex(keyPair.getPublic()),
    }
}

function signHash (secretKey, hash) {
    return ec.keyFromSecret(secretKey).sign(hash).toHex().toLowerCase();
}

function verifySignature (publicKey, signature, hash) {
    return ec.keyFromPublic(publicKey, 'hex').verify(hash, signature);
}

module.exports = {generateKeyPair, signHash, verifySignature};
