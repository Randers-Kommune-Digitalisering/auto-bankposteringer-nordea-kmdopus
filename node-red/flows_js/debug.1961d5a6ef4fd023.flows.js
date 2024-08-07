const Node = {
  "id": "1961d5a6ef4fd023",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "991be0015ce8239a",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"masterData created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"masterData already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 255,
  "y": 580,
  "wires": [],
  "l": false
}

module.exports = Node;