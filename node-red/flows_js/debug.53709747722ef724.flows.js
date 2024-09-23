const Node = {
  "id": "53709747722ef724",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "83a83adf1d5ad76d",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": $globalContext(\"configs\").names.bankAccounts & \" imported from database\",\t    \"Sum of accounts\": $globalContext(\"bankAccounts\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1105,
  "y": 520,
  "wires": [],
  "l": false
}

module.exports = Node;