const Node = {
  "id": "725dec5f3e107c72",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "567cd96f0f1d0862",
  "name": "Autoindex rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 155,
  "y": 1160,
  "wires": [
    [
      "9f676b58f8e05d1b"
    ]
  ],
  "icon": "font-awesome/fa-sort-numeric-asc",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let masterObj = global.get("masterData") || {};
  let rules = masterObj.rules || [];
  
  for (let i = 0; i < rules.length; i++) {
      rules[i].ruleID = i + 1; // Starter fra 1, brug i hvis du vil starte fra 0
  }
  
  masterObj.rules = rules;
  global.set("masterData", masterObj);
  
  return msg;
}

module.exports = Node;