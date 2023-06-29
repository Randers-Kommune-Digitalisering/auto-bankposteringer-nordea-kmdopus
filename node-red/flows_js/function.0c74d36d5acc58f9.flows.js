const Node = {
  "id": "0c74d36d5acc58f9",
  "type": "function",
  "z": "e37c26303529a6e8",
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
      "e307a6d6dad909ec"
    ]
  ],
  "_order": 133
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const data = Buffer.from(msg.payload.norm_str);
  const sign = crypto.sign("SHA256", data, msg.payload.privateKey);
  const signature = sign.toString("base64");
  
  msg.payload.sign = signature;
  
  return msg;
}

module.exports = Node;