const Node = {
  "id": "6d8dd0ed759fecd5",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "g": "ab09acdf85426f34",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"bankAccounts created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"bankAccounts already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 255,
  "y": 720,
  "wires": [],
  "l": false
}

module.exports = Node;