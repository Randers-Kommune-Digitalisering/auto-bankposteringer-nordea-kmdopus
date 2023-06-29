const Node = {
  "id": "02df18056dda2921",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Signing 2",
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
  "x": 520,
  "y": 700,
  "wires": [
    [
      "78c0a54f169e2555"
    ]
  ],
  "_order": 120
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const sign = crypto.createSign('SHA256');
  sign.write(msg.payload.norm_str);
  sign.end();
  const signature = sign.sign(msg.payload.privateKey, 'base64');
  
  msg.payload.sign = signature;
  
  return msg;
}

module.exports = Node;