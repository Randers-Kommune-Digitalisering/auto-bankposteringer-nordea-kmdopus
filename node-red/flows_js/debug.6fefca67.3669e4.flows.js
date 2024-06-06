const Node = {
  "id": "6fefca67.3669e4",
  "type": "debug",
  "z": "f91accb007eed9a2",
  "g": "1fb8657a805b873c",
  "name": "OK overførsel FTP",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"XML-file successfully transferred to FTP-server\",\t   \"Path to file\": $flowContext('filenameFTPlocal'),\t   \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 615,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;