const Node = {
  "id": "70edd7afc106db1f",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "77f345d4689dee38",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"accountingRules imported from database\",\t    \"Sum of rules\": $globalContext(\"accountingRules\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1225,
  "y": 600,
  "wires": [],
  "l": false
}

module.exports = Node;