const Node = {
  "id": "08f8ef9c6813638f",
  "type": "debug",
  "z": "cc3305da0e5c71f6",
  "g": "46c70bcd77ca965a",
  "name": "Rules imported",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": $globalContext(\"configs\").names.accountingRules & \" imported from csv-file\",\t    \"File location\": csvPath,\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 335,
  "y": 160,
  "wires": [],
  "l": false
}

module.exports = Node;