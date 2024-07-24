const Node = {
  "id": "ddabb3f74b2fc6ac",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "aa5769a7dca8b6f4",
  "name": "Reset RuleID",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "csv",
      "module": "csv-parser"
    }
  ],
  "x": 685,
  "y": 60,
  "wires": [
    [
      "ef80d0ad60a69aa1"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  const rules = global.get("accountingRules");
  
  rules.forEach((rule, index) => {
      rule.RuleID = index;
  });
  
  global.set("accountingRules", rules);
  
  return msg;
}

module.exports = Node;