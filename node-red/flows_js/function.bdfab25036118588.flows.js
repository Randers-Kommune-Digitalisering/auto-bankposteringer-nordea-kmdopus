const Node = {
  "id": "bdfab25036118588",
  "type": "function",
  "z": "257592181f6612d1",
  "name": "Signing 1",
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
  "y": 200,
  "wires": [
    [
      "05bfc10ff33378e7"
    ]
  ],
  "_order": 132
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const data = Buffer.from(msg.payload.norm_str);
  const sign = crypto.sign("SHA256", data, msg.payload.privateKey);
  const signature = sign.toString("base64");
  
  msg.payload.sign = signature;
  
  return msg;
}

module.exports = Node;