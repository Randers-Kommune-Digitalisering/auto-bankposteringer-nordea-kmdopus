const Node = {
  "id": "2d516874199b8a29",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Update status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"accountingRules table updated\",\t    \"Number of entries affected\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in accountingRules\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 495,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;