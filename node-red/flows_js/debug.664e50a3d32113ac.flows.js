const Node = {
  "id": "664e50a3d32113ac",
  "type": "debug",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "OK overførsel FTP",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"XML-file successfully transferred to FTP-server\",\t   \"Path to file\": $flowContext('filenameFTPlocal'),\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 805,
  "y": 200,
  "wires": [],
  "l": false
}

module.exports = Node;