const Node = {
  "id": "a1f41777ba5459a4",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "Transactions retrieved",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Status Code\": msg.statusCode,\t   \"Amount of transactions\": $globalContext('transactions').length,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 645,
  "y": 480,
  "wires": [],
  "l": false
}

module.exports = Node;