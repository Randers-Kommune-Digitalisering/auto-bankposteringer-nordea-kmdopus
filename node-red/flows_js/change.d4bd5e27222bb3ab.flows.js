const Node = {
  "id": "d4bd5e27222bb3ab",
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
  "y": 580,
  "wires": [
    [
      "b82ab88d55406753"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;