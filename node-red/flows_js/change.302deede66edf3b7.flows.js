const Node = {
  "id": "302deede66edf3b7",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9d7a704133314cab",
  "name": "Subtract step",
  "rules": [
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "$flowContext(\"step\")-1",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 145,
  "y": 440,
  "wires": [
    [
      "02213fe18223d94a"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;