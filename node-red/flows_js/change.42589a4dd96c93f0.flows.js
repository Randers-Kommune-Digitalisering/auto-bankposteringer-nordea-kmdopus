const Node = {
  "id": "42589a4dd96c93f0",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "4169783d237ba908",
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
  "x": 195,
  "y": 460,
  "wires": [
    [
      "fdb5f980fe740298"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;