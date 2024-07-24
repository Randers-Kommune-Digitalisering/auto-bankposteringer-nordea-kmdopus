const Node = {
  "id": "8b4c3ee1f0bc47c1",
  "type": "change",
  "z": "VueExample",
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
  "x": 390,
  "y": 420,
  "wires": [
    [
      "094955872374a0cf"
    ]
  ]
}

module.exports = Node;