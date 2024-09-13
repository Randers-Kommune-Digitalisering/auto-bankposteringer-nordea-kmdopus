const Node = {
  "id": "3150084866746144",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "08a9715c85ab97c1",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": $globalContext(\"configs\").names.accountingRules & \" imported from database\",\t    \"Sum of rules\": $globalContext(\"accountingRules\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1095,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;