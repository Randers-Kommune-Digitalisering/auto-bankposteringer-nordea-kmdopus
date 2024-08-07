const Node = {
  "id": "d751a64efac9a957",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "9e5398bb4491a461",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Rules updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No rules to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 705,
  "y": 580,
  "wires": [],
  "l": false
}

module.exports = Node;