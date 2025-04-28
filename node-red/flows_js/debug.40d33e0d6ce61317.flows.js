const Node = {
  "id": "40d33e0d6ce61317",
  "type": "debug",
  "z": "2380efc0fb66c87e",
  "g": "73b9b3deaf04ef3b",
  "name": "Transactions retrieved",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Status Code\": msg.statusCode,\t   \"Auth status\": payload.response.status,\t   \"Booking date\": $globalContext('dates').bookingDate,\t   \"Amount of transactions\": $count($globalContext('transactions').add ? $globalContext('transactions').add : []),\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 465,
  "y": 480,
  "wires": [],
  "l": false
}

module.exports = Node;