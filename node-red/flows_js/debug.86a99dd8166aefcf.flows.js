const Node = {
  "id": "86a99dd8166aefcf",
  "type": "debug",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Exchange token retrieved",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Status Code\": msg.statusCode,\t   \"Auth status\": msg.payload.response.status,\t   \"Response\": msg,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 425,
  "y": 180,
  "wires": [],
  "l": false
}

module.exports = Node;