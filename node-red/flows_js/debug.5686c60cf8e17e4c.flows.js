const Node = {
  "id": "5686c60cf8e17e4c",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "name": "Debug",
  "active": true,
  "tosidebar": true,
  "console": false,
  "tostatus": false,
  "complete": "payload.affectedRows > 0 ?\t{\t    \"db\": \"rules inserted\",\t    \"table\": \"konteringsregler\",\t    \"ruleCount\": payload.affectedRows\t}\t:\t{\t    \"db\": \"table already exists\",\t    \"table\": \"konteringsregler\"\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1670,
  "y": 220,
  "wires": []
}

module.exports = Node;