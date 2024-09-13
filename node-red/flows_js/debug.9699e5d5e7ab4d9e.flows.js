const Node = {
  "id": "9699e5d5e7ab4d9e",
  "type": "debug",
  "z": "32cf2bec698ca424",
  "g": "a6213de5d0ba3b76",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Bank accounts updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No bank accounts to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1185,
  "y": 420,
  "wires": [],
  "l": false
}

module.exports = Node;