const Node = {
  "id": "2ff7913e4b37c7d5",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Authorization Status succes",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Authorization status retrieved\",\t   \"Status Code\": msg.statusCode,\t   \"Auth Status\": msg.payload.response.status,\t   \"Response\": msg.payload.response,\t   \"Number of status retrievals\": $globalContext(\"adminAuthAttempt\") + 1,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 795,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;