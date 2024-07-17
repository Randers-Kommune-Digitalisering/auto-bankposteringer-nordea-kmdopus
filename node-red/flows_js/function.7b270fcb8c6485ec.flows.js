const Node = {
  "id": "7b270fcb8c6485ec",
  "type": "function",
  "z": "VueExample",
  "name": "set msg.payload",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 540,
  "y": 280,
  "wires": [
    [
      "16bbec781e708ac6"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  msg.payload = (global.get("konteringsregler"))[msg.uid];
  return msg;
}

module.exports = Node;