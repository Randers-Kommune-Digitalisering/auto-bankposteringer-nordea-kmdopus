const Node = {
  "id": "c97cf3aed444eb14",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "MySQL query status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"Message\": \"runHistory table created\",\t    \"Timestamp\": $now()\t\t}\t:\t{\t    \"Message\": \"runHistory table already exists\",\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 495,
  "y": 660,
  "wires": [],
  "l": false
}

module.exports = Node;