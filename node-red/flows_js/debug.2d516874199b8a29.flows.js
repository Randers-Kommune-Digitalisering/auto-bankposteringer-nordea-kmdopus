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
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"accountingRules table updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in accountingRules\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 675,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;