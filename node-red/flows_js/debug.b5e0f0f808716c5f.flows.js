const Node = {
  "id": "b5e0f0f808716c5f",
  "type": "debug",
  "z": "37f6db37c66da295",
  "g": "c31ca42d52037078",
  "name": "API common error",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Error on authorisation. Retry in 1 hour.\",\t   \"Status Code\": msg.statusCode,\t   \"Error\": msg.payload.error,\t   \"Payload\": msg.payload,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 205,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;