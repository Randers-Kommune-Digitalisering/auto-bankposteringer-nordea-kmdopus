const Node = {
  "id": "ae29590ffecf3f5b",
  "type": "debug",
  "z": "37f6db37c66da295",
  "g": "c31ca42d52037078",
  "name": "API client error",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Client side error on authorisation. Retry in 1 hour.\",\t   \"Status Code\": msg.statusCode,\t   \"Error\": msg.payload.error,\t   \"Payload\": msg.payload,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 195,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;