const Node = {
  "id": "09087e33dc612f05",
  "type": "debug",
  "z": "ee0cf4ce372e2d36",
  "name": "SFTP Upload",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.filepath ~> $exists() ? true : false",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 990,
  "y": 320,
  "wires": []
}

module.exports = Node;