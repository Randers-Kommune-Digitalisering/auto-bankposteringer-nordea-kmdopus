const Node = {
  "id": "bfcbd525af1bb259",
  "type": "debug",
  "z": "a1dc9966e881ac6b",
  "g": "68f21991ad3e5be0",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"accountingRules table overwritten\",\t    \"Number of entries affected\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in accountingRules\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1145,
  "y": 60,
  "wires": [],
  "l": false
}

module.exports = Node;