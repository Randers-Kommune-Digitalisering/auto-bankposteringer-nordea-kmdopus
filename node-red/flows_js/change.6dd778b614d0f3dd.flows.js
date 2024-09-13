const Node = {
  "id": "6dd778b614d0f3dd",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Set flow vars",
  "rules": [
    {
      "t": "set",
      "p": "banking_domain",
      "pt": "flow",
      "to": "https://open.nordea.com",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "0",
      "tot": "num"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 455,
  "y": 60,
  "wires": [
    [
      "4b416d74e555ec27"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;