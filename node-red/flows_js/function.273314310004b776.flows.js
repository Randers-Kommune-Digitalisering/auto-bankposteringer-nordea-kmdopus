const Node = {
  "id": "273314310004b776",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "626b62f44f191d09",
  "name": "Filter",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 365,
  "y": 800,
  "wires": [
    [
      "f0746be064c42d06"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = global.get("accountingRules");
  const activeRules = rules.filter(rule => rule.Exception === true);
  
  msg.payload = activeRules;
  
  return msg;
}

module.exports = Node;