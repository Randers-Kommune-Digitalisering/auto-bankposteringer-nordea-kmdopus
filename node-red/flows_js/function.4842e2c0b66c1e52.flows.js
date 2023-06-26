const Node = {
  "id": "4842e2c0b66c1e52",
  "type": "function",
  "z": "0bc16db685bd2e6a",
  "g": "db28c2d0ad9574a4",
  "name": "Generate crypto key pair",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "crypto",
      "module": "crypto"
    }
  ],
  "x": 190,
  "y": 600,
  "wires": [
    []
  ],
  "_order": 84
}

Node.initialize = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  // Generate an asymmetric key pair
  
  function generateKeyPair() {
      const { publicKey, privateKey } = crypto.generateKeyPairSync(
          'rsa',
          {
              modulusLength: 2048,
          }
      );
      return { publicKey, privateKey };
  }
  
  const { publicKey, privateKey } = generateKeyPair();
  
  /// Export a key in a format that can be imported using the Web Crypto API
  
  function exportPublicKey()
  {
      const exportedKey = publicKey.export({
          type: 'spki',
          format: 'pem'
      });
      return exportedKey;
  }
  
  // Set flow variables
  
  flow.set("publicKey", publicKey);
  flow.set("privateKey", privateKey);
  
  flow.set("publicPem", exportPublicKey());
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  
  return msg;
}

module.exports = Node;