const Node = {
  "id": "d7f6647fcf626fd1",
  "type": "debug",
  "z": "ee0cf4ce372e2d36",
  "name": "SFTP Download",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.filedata ~> $exists() ? true : false",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1000,
  "y": 480,
  "wires": []
}

module.exports = Node;