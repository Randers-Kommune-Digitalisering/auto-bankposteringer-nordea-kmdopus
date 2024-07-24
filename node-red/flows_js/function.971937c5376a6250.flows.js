const Node = {
  "id": "971937c5376a6250",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "a1731ff3f2478f16",
  "name": "Filter",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 125,
  "y": 1020,
  "wires": [
    [
      "164a32c192d0aa99"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = global.get("accountingRules");
  const inactiveRules = rules.filter(rule => rule.Active === false);
  
  msg.payload = inactiveRules;
  
  return msg;
}

module.exports = Node;