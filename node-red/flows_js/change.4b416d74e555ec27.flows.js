const Node = {
  "id": "4b416d74e555ec27",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Set flow vars",
  "rules": [
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "0",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "adminAuthAttempt",
      "pt": "global",
      "to": "0",
      "tot": "num"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 495,
  "y": 80,
  "wires": [
    [
      "c3ad8664145bd9e7"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;