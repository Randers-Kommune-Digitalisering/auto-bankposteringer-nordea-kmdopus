const Node = {
  "id": "2fa52dad069032f1",
  "type": "debug",
  "z": "74de194f4f0868a4",
  "g": "6214c4bc07e80d53",
  "name": "New rule added",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t   \"Message\": \"Rule changed\",\t   \"Action\":$flowContext('ruleAction'),\t   \"Rule\":$globalContext('selectedRule'),\t   \"Timestamp\": $now()\t\t}",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 545,
  "y": 1060,
  "wires": [],
  "l": false
}

module.exports = Node;