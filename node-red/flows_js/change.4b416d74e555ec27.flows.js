const Node = {
  "id": "4b416d74e555ec27",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Initialize counters",
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
  "x": 545,
  "y": 100,
  "wires": [
    [
      "0db12710e10faee7"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;