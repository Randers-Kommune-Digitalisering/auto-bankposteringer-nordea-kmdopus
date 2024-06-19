const Node = {
  "id": "b5e0f0f808716c5f",
  "type": "debug",
  "z": "37f6db37c66da295",
  "g": "c31ca42d52037078",
  "name": "stdout API fail",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"API call failed\",\t   \"Status Code\": msg.statusCode,\t   \"Error\": msg.payload.error.failures,\t   \"Payload\": msg.payload,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1625,
  "y": 200,
  "wires": [],
  "l": false
}

module.exports = Node;