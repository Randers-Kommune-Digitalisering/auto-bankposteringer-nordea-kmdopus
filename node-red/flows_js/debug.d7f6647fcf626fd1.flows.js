const Node = {
  "id": "d7f6647fcf626fd1",
  "type": "debug",
  "z": "ee0cf4ce372e2d36",
  "g": "20a8bc261e47e665",
  "name": "SFTP Download",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.filedata ~> $exists() ? true : false",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 540,
  "y": 340,
  "wires": []
}

module.exports = Node;