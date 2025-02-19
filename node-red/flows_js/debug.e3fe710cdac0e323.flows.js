const Node = {
  "id": "e3fe710cdac0e323",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "Update status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"masterData table updated\",\t    \"Number of entries updated\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in masterData\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1125,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;