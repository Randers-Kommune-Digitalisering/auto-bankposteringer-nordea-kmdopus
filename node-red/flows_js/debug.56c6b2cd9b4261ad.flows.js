const Node = {
  "id": "56c6b2cd9b4261ad",
  "type": "debug",
  "z": "30ea9c666c3d34a6",
  "g": "7b845d1f4aada5fa",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"runHistory table updated\",\t    \"Number of entries updated\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in runHistory\"\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 735,
  "y": 540,
  "wires": [],
  "l": false
}

module.exports = Node;