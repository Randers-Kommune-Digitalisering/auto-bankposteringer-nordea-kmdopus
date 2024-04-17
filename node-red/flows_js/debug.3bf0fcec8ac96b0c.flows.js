const Node = {
  "id": "3bf0fcec8ac96b0c",
  "type": "debug",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "stdout Hovedkonto",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Transactions retrieved from 'hovedkonto'\",\t   \"Status Code\": msg.statusCode,\t   \"Transactions\": msg.payload.response.transactions,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1145,
  "y": 280,
  "wires": [],
  "l": false
}

module.exports = Node;