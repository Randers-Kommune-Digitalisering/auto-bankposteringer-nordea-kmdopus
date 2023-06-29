const Node = {
  "id": "c603f68725378e2c",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Generér dato",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 290,
  "y": 120,
  "wires": [
    [
      "386edb9e4fc6ddda"
    ]
  ],
  "_order": 132
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;