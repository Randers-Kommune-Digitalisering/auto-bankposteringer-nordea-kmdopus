const Node = {
  "id": "a2a2f11b20339b7d",
  "type": "debug",
  "z": "32cf2bec698ca424",
  "g": "a786d45e48e05c06",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"Master data updated\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"No entries to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 555,
  "y": 1180,
  "wires": [],
  "l": false
}

module.exports = Node;