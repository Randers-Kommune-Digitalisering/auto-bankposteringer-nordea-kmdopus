const Node = {
  "id": "179f81904aba6a86",
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
  "y": 1060,
  "wires": [
    [
      "fce4b314011309a0"
    ]
  ],
  "_order": 148
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;