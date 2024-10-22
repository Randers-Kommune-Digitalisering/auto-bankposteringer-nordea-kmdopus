const Node = {
  "id": "b1a69223e4a26f02",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"New rule added\",\t    \"New rule\": $globalContext(\"newRule\"),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 585,
  "y": 280,
  "wires": [],
  "l": false
}

module.exports = Node;