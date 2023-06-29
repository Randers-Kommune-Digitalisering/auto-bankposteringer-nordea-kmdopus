const Node = {
  "id": "93f638884d526e86",
  "type": "function",
  "z": "9f235917ac3d8025",
  "g": "0c92e6b2619b7b2f",
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
  "_order": 93
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