const Node = {
  "id": "d02d33c38f2b5fb9",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"runHistory imported from database\",\t    \"Sum of entries\": $globalContext(\"runHistory\") ~> $count(),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 495,
  "y": 720,
  "wires": [],
  "l": false
}

module.exports = Node;