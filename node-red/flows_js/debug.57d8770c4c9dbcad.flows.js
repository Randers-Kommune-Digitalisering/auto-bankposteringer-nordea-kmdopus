const Node = {
  "id": "57d8770c4c9dbcad",
  "type": "debug",
  "z": "32cf2bec698ca424",
  "g": "e3a1fa8058d9a961",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"Rule updated\",\t    \"Updated from\": $flowContext(\"updatedFromRule\"),\t    \"Updated to\": $flowContext(\"updatedToRule\")\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 325,
  "y": 520,
  "wires": [],
  "l": false
}

module.exports = Node;