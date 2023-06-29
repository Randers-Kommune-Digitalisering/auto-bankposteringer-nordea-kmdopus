const Node = {
  "id": "94735ca155d2c1fa",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Generér dato",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 270,
  "y": 1480,
  "wires": [
    [
      "cadea25d48b8e73b"
    ]
  ],
  "_order": 165
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;