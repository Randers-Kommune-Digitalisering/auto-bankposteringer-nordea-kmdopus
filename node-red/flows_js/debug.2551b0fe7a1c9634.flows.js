const Node = {
  "id": "2551b0fe7a1c9634",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "9e8459915626dabc",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"accountingRules created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"accountingRules already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 255,
  "y": 440,
  "wires": [],
  "l": false
}

module.exports = Node;