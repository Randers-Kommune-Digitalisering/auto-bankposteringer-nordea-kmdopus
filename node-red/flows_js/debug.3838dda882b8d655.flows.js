const Node = {
  "id": "3838dda882b8d655",
  "type": "debug",
  "z": "202e1898db8daa8b",
  "g": "2677659fd0ff4476",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Bank accounts updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No bank accounts to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1865,
  "y": 60,
  "wires": [],
  "l": false
}

module.exports = Node;