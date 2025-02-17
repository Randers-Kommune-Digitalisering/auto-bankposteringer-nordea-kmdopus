const Node = {
  "id": "775c6bda92425e46",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"runHistory table updated\",\t    \"Number of entries updated\": payload.affectedRows\t}\t:\t{\t    \"Message\": \"Nothing to update in runHistory\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1225,
  "y": 240,
  "wires": [],
  "l": false
}

module.exports = Node;