const Node = {
  "id": "be1b2d52d0b2ecce",
  "type": "debug",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "Authorization status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Status Code\": statusCode,\t   \"Auth status\": payload.response.status ? payload.response.status :$globalContext('auth').adminStatus,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 465,
  "y": 260,
  "wires": [],
  "l": false
}

module.exports = Node;