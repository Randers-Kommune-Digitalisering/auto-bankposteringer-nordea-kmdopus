const Node = {
  "id": "9699e5d5e7ab4d9e",
  "type": "debug",
  "z": "32cf2bec698ca424",
  "g": "fd2d20f8e7169b95",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"bankAccounts updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in bankAccounts\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 615,
  "y": 580,
  "wires": [],
  "l": false
}

module.exports = Node;