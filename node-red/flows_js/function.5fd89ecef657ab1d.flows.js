const Node = {
  "id": "5fd89ecef657ab1d",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "626b62f44f191d09",
  "name": "Set return page",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 525,
  "y": 800,
  "wires": [
    [
      "2d8c7469c871830c",
      "21f0a906a7b7eade"
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