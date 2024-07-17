const Node = {
  "id": "169f2a631aaa1be7",
  "type": "debug",
  "z": "9b998b2e60b3c784",
  "name": "Debug",
  "active": true,
  "tosidebar": true,
  "console": false,
  "tostatus": false,
  "complete": "$globalContext(\"konteringsregler\") ~> $exists() ?\t{\t    \"db\": \"rules loaded from db\",\t    \"table\": \"konteringsregler\",\t    \"ruleCount\": $globalContext(\"konteringsregler\") ~> $count()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 1550,
  "y": 320,
  "wires": []
}

module.exports = Node;