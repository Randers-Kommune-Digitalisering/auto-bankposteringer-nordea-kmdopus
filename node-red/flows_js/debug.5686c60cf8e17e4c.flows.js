const Node = {
  "id": "5686c60cf8e17e4c",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "db9c10bd096dcbc3",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Rules updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No rules to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1185,
  "y": 60,
  "wires": [],
  "l": false
}

module.exports = Node;