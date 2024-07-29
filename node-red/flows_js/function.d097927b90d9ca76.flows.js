const Node = {
  "id": "d097927b90d9ca76",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "16d12208d30e4c48",
  "name": "Filter",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 365,
  "y": 560,
  "wires": [
    [
      "a4bf025ca58ec2f7"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = global.get("accountingRules");
  const activeRules = rules.filter(rule => rule.Active === true);
  
  msg.payload = activeRules;
  
  return msg;
}

module.exports = Node;