const Node = {
  "id": "a1f41777ba5459a4",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "List Transactions succes",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Transactions retrieved\",\t   \"Status Code\": msg.statusCode,\t   \"Amount of transactions\":$globalContext('transactions').length,\t   \"Response\": msg,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 795,
  "y": 340,
  "wires": [],
  "l": false
}

module.exports = Node;