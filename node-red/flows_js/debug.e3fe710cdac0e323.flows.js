const Node = {
  "id": "e3fe710cdac0e323",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "769eb9119e1608d5",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": $globalContext(\"configs\").names.masterData & \" updated\"\t}\t:\t{\t    \"Message\": \"Nothing to update\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 695,
  "y": 300,
  "wires": [],
  "l": false
}

module.exports = Node;