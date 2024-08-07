const Node = {
  "id": "1f120149d65c72a3",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "702997f9bea3aa27",
  "name": "Parse",
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
  "x": 305,
  "y": 180,
  "wires": [
    [
      "898f1234aebf1a9e"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;