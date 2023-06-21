const Node = {
  "id": "2ab03cd1689cdce4",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "encoding",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 240,
  "y": 120,
  "wires": [
    [
      "a61a6f80b22ac058"
    ]
  ],
  "_order": 22
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const crypto = require('crypto');
  
  const normalizedString = msg.normalizedString;
  const privateKey = msg.privateKey;
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.write(normalizedString);
  signer.end();
  
  const signature = signer.sign(privateKey, 'base64');
  
  msg.signature = signature;
  
  console.log(`Signature: ${signature}`);
  
  return msg;
  
  
}

module.exports = Node;