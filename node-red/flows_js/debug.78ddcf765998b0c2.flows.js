const Node = {
  "id": "78ddcf765998b0c2",
  "type": "debug",
  "z": "a1dc9966e881ac6b",
  "name": "Fejl - umatchede posteringer passer ikke i db",
  "active": true,
  "tosidebar": true,
  "console": false,
  "tostatus": false,
  "complete": "true",
  "targetType": "full",
  "statusVal": "",
  "statusType": "auto",
  "x": 1110,
  "y": 560,
  "wires": [],
  "info": ""
}

Node.info = `
Blandt andet fordi amount ikke bliver parset til string på minusbeløb over 999 kr.
`

module.exports = Node;