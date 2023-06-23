const Node = {
  "id": "1c1a134df7329f8b",
  "type": "function",
  "z": "b2c910a3562c542e",
  "name": "Base64 encoding",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 530,
  "y": 320,
  "wires": [
    [
      "5a652deda58405f0",
      "eeae61e2c64e1863"
    ]
  ],
  "_order": 55
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const hash = Buffer.from(msg.payload);
  const base64EncodedString = hash.toString('base64');
  
  msg.payload = base64EncodedString;
  
  return msg;
}

module.exports = Node;