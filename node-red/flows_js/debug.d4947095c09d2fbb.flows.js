const Node = {
  "id": "d4947095c09d2fbb",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "77f345d4689dee38",
  "name": "Update status",
  "active": true,
  "tosidebar": false,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"New unmatched transactions added\",\t    \"Transactions\": $globalContext(\"transactionsWithNoMatch\"),\t    \"Timestamp\": $now()\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 495,
  "y": 880,
  "wires": [],
  "l": false
}

module.exports = Node;