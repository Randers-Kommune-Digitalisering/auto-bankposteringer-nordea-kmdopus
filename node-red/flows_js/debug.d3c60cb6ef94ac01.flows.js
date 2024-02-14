const Node = {
  "id": "d3c60cb6ef94ac01",
  "type": "debug",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "stdout Auth Status succes",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Authorization status retrieved\",\t   \"Authorization Status\": msg.payload.response.status,\t   \"Admin authorization attempts\": $flowContext(\"adminAuthAttempt\"),\t   \"Status Code\": msg.statusCode,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1125,
  "y": 140,
  "wires": [],
  "l": false
}

module.exports = Node;