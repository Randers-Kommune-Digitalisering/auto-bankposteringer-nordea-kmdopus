const Node = {
  "id": "d9efe856a3a7ba1b",
  "type": "function",
  "z": "257592181f6612d1",
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
      "1a7164ddb57e522c"
    ]
  ],
  "_order": 116
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