const Node = {
  "id": "76f802fdcc785bfb",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "4de35340ec27d363",
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
  "y": 440,
  "wires": [],
  "l": false
}

module.exports = Node;