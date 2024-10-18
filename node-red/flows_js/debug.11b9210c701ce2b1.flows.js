const Node = {
  "id": "11b9210c701ce2b1",
  "type": "debug",
  "z": "cc3305da0e5c71f6",
  "g": "e5ed88aeaeb05808",
  "name": "Rules exported",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": $globalContext(\"configs\").names.accountingRules & \" written to json-file\",\t    \"File location\": jsonPath,\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 215,
  "y": 60,
  "wires": [],
  "l": false
}

module.exports = Node;