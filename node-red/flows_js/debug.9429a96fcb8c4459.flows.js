const Node = {
  "id": "9429a96fcb8c4459",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"bankAccounts table created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"bankAccounts table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1125,
  "y": 500,
  "wires": [],
  "l": false
}

module.exports = Node;