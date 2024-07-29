const Node = {
  "id": "e746918eb6f5b279",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "6214c4bc07e80d53",
  "name": "Update rule",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 105,
  "y": 140,
  "wires": [
    [
      "2fa52dad069032f1",
      "dc6e3d9c7defe293",
      "9c073d0c8ad76f22"
    ]
  ],
  "icon": "font-awesome/fa-repeat",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const rules = global.get("accountingRules");
  const selectedRuleID = global.get("selectedRuleID");
  const selectedRule = global.get("selectedRule");
  const selectedProperty = msg.topic;
  const ruleAction = flow.get("ruleAction");
  const rulesMap = Object.fromEntries(rules.map(rule => [rule.RuleID, rule]));
  let updatedRules = {};
  
  switch (ruleAction) {
      case "Toggle":
          selectedRule.Active = !selectedRule.Active;
          if (rulesMap[selectedRuleID]) {
              rulesMap[selectedRuleID] = selectedRule;
          }
          updatedRules = Object.values(rulesMap);
          global.set("accountingRules", updatedRules);
          break;
          
      case "Delete":
          if (rulesMap[selectedRuleID]) {
              delete rulesMap[selectedRuleID];
          }
          updatedRules = Object.values(rulesMap);
          global.set("accountingRules", updatedRules);
          break;
  
      case "Update":
          selectedRule[selectedProperty] = msg.payload;
          global.set("selectedRule", selectedRule);
          break;
          
      case "Save":
          if (rulesMap[selectedRuleID]) {
              rulesMap[selectedRuleID] = selectedRule;
          }
          updatedRules = Object.values(rulesMap);
          global.set("accountingRules", updatedRules);
          break;
  }
  
  msg.payload = ruleAction
  return msg;
}

module.exports = Node;