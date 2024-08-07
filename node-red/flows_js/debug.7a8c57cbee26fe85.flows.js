const Node = {
  "id": "7a8c57cbee26fe85",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "b56ac63d41e82307",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Bank accounts updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No bank accounts to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 705,
  "y": 720,
  "wires": [],
  "l": false
}

module.exports = Node;