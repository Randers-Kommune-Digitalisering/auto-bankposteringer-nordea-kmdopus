const Node = {
  "id": "340f677620d0af33",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Exchange Refresh Token succes",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"New access token retrieved\",\t   \"Status Code\": msg.statusCode,\t   \"Auth status\": msg.payload.response.status,\t   \"Response\": msg,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 795,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;