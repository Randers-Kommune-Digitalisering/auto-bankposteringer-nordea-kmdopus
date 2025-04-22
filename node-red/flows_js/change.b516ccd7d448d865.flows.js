const Node = {
  "id": "b516ccd7d448d865",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "8b08bffaebfa240f",
  "name": "",
  "rules": [
    {
      "t": "delete",
      "p": "auth.restart",
      "pt": "global"
    },
    {
      "t": "set",
      "p": "reset",
      "pt": "msg",
      "to": "true",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 295,
  "y": 100,
  "wires": [
    [
      "cac990824e2821b2",
      "0d2b913043d108d1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;