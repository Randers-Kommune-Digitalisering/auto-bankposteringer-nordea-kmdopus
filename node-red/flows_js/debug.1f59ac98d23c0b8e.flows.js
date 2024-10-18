const Node = {
  "id": "1f59ac98d23c0b8e",
  "type": "debug",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"Rule updated\",\t    \"Updated from\": $globalContext(\"updatedFromRule\"),\t    \"Updated to\": $globalContext(\"updatedToRule\")\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 585,
  "y": 320,
  "wires": [],
  "l": false
}

module.exports = Node;