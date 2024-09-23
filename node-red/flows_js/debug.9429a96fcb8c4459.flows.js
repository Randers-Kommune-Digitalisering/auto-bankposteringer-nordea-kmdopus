const Node = {
  "id": "9429a96fcb8c4459",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": $globalContext(\"configs\").names.bankAccounts & \" created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": $globalContext(\"configs\").names.bankAccounts & \" table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 265,
  "y": 520,
  "wires": [],
  "l": false
}

module.exports = Node;