const Node = {
  "id": "0a9f12d3c30f9730",
  "type": "debug",
  "z": "8c354b8d2ca56b7b",
  "g": "9707809d7fe4863a",
  "name": "auth failed",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Authentication failed\",\t   \"Status code\": statusCode,\t   \"Auth code\": $globalContext(\"auth\").adminStatus,\t   \"Timestamp\": $now() \t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 215,
  "y": 420,
  "wires": [],
  "l": false
}

module.exports = Node;