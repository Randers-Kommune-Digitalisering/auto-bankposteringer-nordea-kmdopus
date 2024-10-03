const Node = {
  "id": "b9ae3c393ab819fa",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "9707809d7fe4863a",
  "name": "API common error",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Error on authorisation. Retry in 1 hour.\",\t   \"Status Code\": msg.statusCode,\t   \"Error\": msg.payload.error,\t   \"Payload\": msg.payload,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 185,
  "y": 320,
  "wires": [],
  "l": false
}

module.exports = Node;