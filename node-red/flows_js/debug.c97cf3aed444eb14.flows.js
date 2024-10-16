const Node = {
  "id": "c97cf3aed444eb14",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "c6445a5238f0bf3b",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"runHistory table created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"runHistory table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 265,
  "y": 660,
  "wires": [],
  "l": false
}

module.exports = Node;