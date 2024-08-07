const Node = {
  "id": "4473c54d1fbade2d",
  "type": "debug",
  "z": "202e1898db8daa8b",
  "g": "9a4bf534fe58df76",
  "name": "Update status",
  "active": true,
  "tosidebar": true,
  "console": true,
  "tostatus": false,
  "complete": "{\t    \"Message\": \"Rule updated\",\t    \"Updated from\": $flowContext(\"updatedFromRule\"),\t    \"Updated to\": $flowContext(\"updatedToRule\")\t}\t",
  "targetType": "jsonata",
  "statusVal": "",
  "statusType": "auto",
  "x": 695,
  "y": 60,
  "wires": [],
  "l": false
}

module.exports = Node;