const Node = {
  "id": "3822931a2b22181a",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "6dfe26228ab4f389",
  "name": "Set db initial accountingRules",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.accountingRules",
      "pt": "global",
      "to": "[{}]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 495,
  "y": 300,
  "wires": [
    [
      "a31ad194ed05bfc3"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;