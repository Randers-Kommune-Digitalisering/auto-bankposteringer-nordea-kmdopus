const Node = {
  "id": "ac2ed77cbacea24c",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "e8e6c41949b01e67",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"bankAccounts table updated\",\t    \"Number of accounts updated\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in bankAccounts\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 675,
  "y": 520,
  "wires": [],
  "l": false
}

module.exports = Node;