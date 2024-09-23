const Node = {
  "id": "a1a073eaab9509de",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": $globalContext(\"configs\").names.masterData & \" created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": $globalContext(\"configs\").names.masterData & \" table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 265,
  "y": 380,
  "wires": [],
  "l": false
}

module.exports = Node;