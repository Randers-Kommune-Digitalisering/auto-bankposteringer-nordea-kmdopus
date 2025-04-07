const Node = {
  "id": "88df001ee2611469",
  "type": "debug",
  "z": "8c354b8d2ca56b7b",
  "g": "ea1bf65dfedc00a0",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"runHistory table updated\",\t    \"Number of entries updated\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in runHistory\"\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 635,
  "y": 340,
  "wires": [],
  "l": false
}

module.exports = Node;