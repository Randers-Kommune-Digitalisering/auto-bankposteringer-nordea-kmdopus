const Node = {
  "id": "8d56e6a3a8b1954f",
  "type": "debug",
  "z": "ee0cf4ce372e2d36",
  "g": "202a6b173abfc606",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"accountingRules table overwritten\",\t    \"Number of entries affected\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in accountingRules\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 765,
  "y": 100,
  "wires": [],
  "l": false
}

module.exports = Node;