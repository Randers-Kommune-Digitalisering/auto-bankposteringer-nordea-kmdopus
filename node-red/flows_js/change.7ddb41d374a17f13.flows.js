const Node = {
  "id": "7ddb41d374a17f13",
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
  "y": 380,
  "wires": [
    [
      "61676c6c7947def6"
    ]
  ]
}

module.exports = Node;