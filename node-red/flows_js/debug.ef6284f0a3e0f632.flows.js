const Node = {
  "id": "ef6284f0a3e0f632",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "ccdbed98c6151465",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": $globalContext(\"configs\").names.masterData & \" imported from database\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1095,
  "y": 300,
  "wires": [],
  "l": false
}

module.exports = Node;