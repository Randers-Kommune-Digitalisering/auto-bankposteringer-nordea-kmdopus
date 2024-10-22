const Node = {
  "id": "ac2ed77cbacea24c",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"bankAccounts table updated\",\t    \"Number of entries updated\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in bankAccounts\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 585,
  "y": 740,
  "wires": [],
  "l": false
}

module.exports = Node;