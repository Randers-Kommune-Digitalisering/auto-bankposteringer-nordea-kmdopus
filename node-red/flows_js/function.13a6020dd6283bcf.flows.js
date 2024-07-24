const Node = {
  "id": "13a6020dd6283bcf",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "16d12208d30e4c48",
  "name": "Set return page",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 295,
  "y": 340,
  "wires": [
    [
      "73badd7826ecaf2f",
      "fd2050514e5ad385"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const selectedRuleID = msg.payload.RuleID;
  const rules = global.get("accountingRules");
  const activeBool = msg.payload.Active;
  const exceptionBool = msg.payload.Exception;
  let returnPage = "";
  const selectedRule = rules.filter(rule => rule.RuleID === selectedRuleID);
  
  if (exceptionBool) {
      returnPage = 'Undtagelser'
  } else if (!activeBool) {
      returnPage = 'Inaktive regler'
  } else {
      returnPage = 'Aktive regler'
  }
  
  msg.payload = 'Rediger regel'
  global.set("returnPage", returnPage);
  global.set("selectedRuleID", selectedRuleID)
  global.set("selectedRule", selectedRule[0])
  flow.set("initialLoad", true)
  
  return msg;
}

module.exports = Node;