const Node = {
  "id": "61d0d3680cf7a845",
  "type": "function",
  "z": "c61e25446fe03797",
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
      "618e64317dc85349"
    ]
  ],
  "_order": 35
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const crypto = require('crypto');
  
  const sign = crypto.createSign('sha256');
  
  sign.update(msg.normalizedString);
  
  const privateKey = msg.privateKey; // your PEM-encoded private key
  const signature = sign.sign(privateKey, 'base64');
  console.log(`Signature: ${signature}`);
}

module.exports = Node;