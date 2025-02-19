const Node = {
  "id": "3150084866746144",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"accountingRules imported from database\",\t    \"Sum of rules\": $globalContext(\"accountingRules\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 495,
  "y": 400,
  "wires": [],
  "l": false
}

module.exports = Node;