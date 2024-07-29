const Node = {
  "id": "7e156262a25a3d45",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "4571d34d4f5bd1cf",
  "name": "Push new rule to rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 455,
  "y": 1520,
  "wires": [
    [
      "e4ac595e71cd933d"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = global.get("accountingRules");
  const newRule = global.get("newRule");
  newRule.Active = true;
  newRule.Exception = false;
  
  rules.push(newRule);
  
  global.set("accountingRules", rules);
  
  return msg;
}

module.exports = Node;