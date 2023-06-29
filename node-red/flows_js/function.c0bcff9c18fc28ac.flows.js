const Node = {
  "id": "c0bcff9c18fc28ac",
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
  "y": 620,
  "wires": [
    [
      "e3bc033c77a282ba"
    ]
  ],
  "_order": 115
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;