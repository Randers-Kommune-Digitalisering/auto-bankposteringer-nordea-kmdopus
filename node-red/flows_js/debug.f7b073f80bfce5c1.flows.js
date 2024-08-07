const Node = {
  "id": "f7b073f80bfce5c1",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "45ded2ca44d7d129",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "$globalContext(\"masterData\") ~> $exists() ?\t{\t    \"Message\": \"Master data imported from database\",\t    \"Sum of rules\": $globalContext(\"masterData\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1105,
  "y": 580,
  "wires": [],
  "l": false
}

module.exports = Node;