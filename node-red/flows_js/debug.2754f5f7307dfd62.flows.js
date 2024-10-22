const Node = {
  "id": "2754f5f7307dfd62",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Confirm Authorization",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Authorization confirmed\",\t   \"Status Code\": msg.statusCode,\t   \"Auth status\": msg.payload.response.status,\t   \"Response\": msg,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 795,
  "y": 120,
  "wires": [],
  "l": false
}

module.exports = Node;