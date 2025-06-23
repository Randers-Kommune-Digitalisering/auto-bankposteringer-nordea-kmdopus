const Node = {
  "id": "beab20a3bc744998",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "a40dda636245513b",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "req.params.uid ~> $number()",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 500,
  "wires": [
    [
      "34aed80f407f8789"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;