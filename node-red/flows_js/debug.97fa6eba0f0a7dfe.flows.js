const Node = {
  "id": "97fa6eba0f0a7dfe",
  "type": "debug",
  "z": "37f6db37c66da295",
  "g": "c31ca42d52037078",
  "name": "API 409 error",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Authorisation already started. Await administrators approval.\",\t   \"Status Code\": msg.statusCode,\t   \"Error\": msg.payload.error,\t   \"Payload\": msg.payload,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 205,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;