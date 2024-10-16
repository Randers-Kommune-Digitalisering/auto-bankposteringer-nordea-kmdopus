const Node = {
  "id": "d02d33c38f2b5fb9",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "a753759636e67186",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"runHistory imported from database\",\t    \"Sum of accounts\": $globalContext(\"runHistory\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1105,
  "y": 660,
  "wires": [],
  "l": false
}

module.exports = Node;