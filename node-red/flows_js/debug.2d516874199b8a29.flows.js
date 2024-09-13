const Node = {
  "id": "2d516874199b8a29",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "59157a3330ff3d2f",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": $globalContext(\"configs\").names.accountingRules & \" updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 695,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;