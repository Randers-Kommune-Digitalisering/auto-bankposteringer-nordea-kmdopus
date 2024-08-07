const Node = {
  "id": "cb726429a7fd2f04",
  "type": "debug",
  "z": "202e1898db8daa8b",
  "g": "26bee64ab44fc005",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Master data updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No entries to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1405,
  "y": 60,
  "wires": [],
  "l": false
}

module.exports = Node;