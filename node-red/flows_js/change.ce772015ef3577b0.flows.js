const Node = {
  "id": "ce772015ef3577b0",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f5b0f2cb9d251540",
  "name": "Parse",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "req.params.uid ~> $string()",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1025,
  "y": 100,
  "wires": [
    [
      "790bfd9f011defe5"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;