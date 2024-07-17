const Node = {
  "id": "2551b0fe7a1c9634",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "name": "Debug",
  "active": true,
  "tosidebar": true,
  "console": false,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"db\": \"table created\",\t    \"table\": \"konteringsregler\"\t}\t:\t{\t    \"db\": \"table already exists\",\t    \"table\": \"konteringsregler\"\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1130,
  "y": 120,
  "wires": []
}

module.exports = Node;