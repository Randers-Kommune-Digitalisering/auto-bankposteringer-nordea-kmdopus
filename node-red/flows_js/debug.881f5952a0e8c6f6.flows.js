const Node = {
  "id": "881f5952a0e8c6f6",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": $globalContext(\"configs\").names.accountingRules & \" created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": $globalContext(\"configs\").names.accountingRules & \" table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 265,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;