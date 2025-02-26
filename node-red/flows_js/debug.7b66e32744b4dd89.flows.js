const Node = {
  "id": "7b66e32744b4dd89",
  "type": "debug",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "SFTP Upload",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"XML-file successfully transferred to SFTP-server\",\t   \"Succes\": payload.filepath ~> $exists() ? true : false,\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 455,
  "y": 120,
  "wires": [],
  "l": false
}

module.exports = Node;