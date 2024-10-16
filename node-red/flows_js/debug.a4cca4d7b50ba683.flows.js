const Node = {
  "id": "a4cca4d7b50ba683",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "9707809d7fe4863a",
  "name": "API 409 error",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Authorization already started. Await administrators approval.\",\t   \"Status Code\": msg.statusCode,\t   \"Error\": msg.payload.error,\t   \"Payload\": msg.payload,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 185,
  "y": 460,
  "wires": [],
  "l": false
}

module.exports = Node;