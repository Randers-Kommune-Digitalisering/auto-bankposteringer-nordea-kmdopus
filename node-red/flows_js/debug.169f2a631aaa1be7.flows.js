const Node = {
  "id": "169f2a631aaa1be7",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "9a13326620241f51",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "$globalContext(\"accountingRules\") ~> $exists() ?\t{\t    \"Message\": \"Rules imported from database\",\t    \"Sum of rules\": $globalContext(\"accountingRules\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1105,
  "y": 440,
  "wires": [],
  "l": false
}

module.exports = Node;