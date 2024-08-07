const Node = {
  "id": "cc26931697fdc8dc",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "7c1507aa54800ed5",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "$globalContext(\"bankAccounts\") ~> $exists() ?\t{\t    \"Message\": \"Bank accounts imported from database\",\t    \"Sum of rules\": $globalContext(\"bankAccounts\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1105,
  "y": 720,
  "wires": [],
  "l": false
}

module.exports = Node;