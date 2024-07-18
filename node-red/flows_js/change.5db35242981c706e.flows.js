const Node = {
  "id": "5db35242981c706e",
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
  "x": 370,
  "y": 280,
  "wires": [
    [
      "f9ea4bc100522960"
    ]
  ]
}

module.exports = Node;