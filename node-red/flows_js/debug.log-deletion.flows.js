const Node = {
  "id": "log-deletion",
  "type": "debug",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "Log Deleted Files",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"File deletion status\",\t    \"Files found\": filesCount,\t    \"Files deleted\": $count(deletedFiles)\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 425,
  "y": 1120,
  "wires": [],
  "l": false
}

module.exports = Node;