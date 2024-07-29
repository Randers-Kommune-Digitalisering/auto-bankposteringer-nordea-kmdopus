const Node = {
  "id": "3d94e35ba89c9e3a",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "35de195cfdfd282b",
  "name": "Push new rule to rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 475,
  "y": 1880,
  "wires": [
    [
      "a78305c3cc2e16f9"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = global.get("accountingRules");
  const newRule = global.get("newRule");
  newRule.Active = true;
  newRule.Exception = true;
  
  for (let key in rules[0]) {
      if (!newRule.hasOwnProperty(key)) {
          newRule[key] = null;
      }
  }
  
  rules.push(newRule);
  
  global.set("accountingRules", rules);
  
  return msg;
}

module.exports = Node;