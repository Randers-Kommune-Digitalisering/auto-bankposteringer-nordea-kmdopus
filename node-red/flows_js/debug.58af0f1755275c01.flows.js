const Node = {
  "id": "58af0f1755275c01",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "77f345d4689dee38",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"transactionsWithNoMatch table created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"transactionsWithNoMatch table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 495,
  "y": 840,
  "wires": [],
  "l": false
}

module.exports = Node;