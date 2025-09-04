const Node = {
  "id": "1051bec61b03894f",
  "type": "function",
  "z": "0a57a34536934723",
  "g": "a40dda636245513b",
  "name": "Sort accountingRules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 295,
  "y": 420,
  "wires": [
    [
      "d9f5cb61e2cba617"
    ]
  ],
  "icon": "font-awesome/fa-sort-numeric-asc",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  if (Array.isArray(msg.payload)) {
      msg.payload = msg.payload.sort((a, b) => a.RuleID - b.RuleID);
  } else if (msg.payload) {
      msg.payload = [msg.payload];
  }
  
  return msg;
}

module.exports = Node;