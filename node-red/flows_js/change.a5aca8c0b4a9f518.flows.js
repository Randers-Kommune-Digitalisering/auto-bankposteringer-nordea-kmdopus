const Node = {
  "id": "a5aca8c0b4a9f518",
  "type": "change",
  "z": "32cf2bec698ca424",
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
  "x": 635,
  "y": 540,
  "wires": [
    [
      "4c84a9964f972f17"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;