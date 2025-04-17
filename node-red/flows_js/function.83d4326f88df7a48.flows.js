const Node = {
  "id": "83d4326f88df7a48",
  "type": "function",
  "z": "32cf2bec698ca424",
  "g": "4169783d237ba908",
  "name": "Sort accountingRules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 795,
  "y": 60,
  "wires": [
    [
      "55045eaac04f55a8"
    ]
  ],
  "icon": "font-awesome/fa-sort-numeric-asc",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  if (Array.isArray(msg.payload)) {
      msg.payload = msg.payload.sort((a, b) => a.RuleID - b.RuleID);
  }
  
  return msg;
  
}

module.exports = Node;