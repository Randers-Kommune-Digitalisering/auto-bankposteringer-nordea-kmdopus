const Node = {
  "id": "53709747722ef724",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"bankAccounts imported from database\",\t    \"Sum of accounts\": $globalContext(\"bankAccounts\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 585,
  "y": 780,
  "wires": [],
  "l": false
}

module.exports = Node;