const Node = {
  "id": "2ff7913e4b37c7d5",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Authorization status retrieved",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Status Code\": msg.statusCode,\t   \"Auth Status\": msg.payload.response.status,\t   \"Response\": msg,\t   \"Number of status retrievals\": $globalContext(\"adminAuthAttempt\") + 1,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 425,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;