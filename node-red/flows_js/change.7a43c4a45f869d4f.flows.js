const Node = {
  "id": "7a43c4a45f869d4f",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "8b08bffaebfa240f",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "auth.adminStatus",
      "pt": "global",
      "to": "RESTARTING",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "auth.restart",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 385,
  "y": 60,
  "wires": [
    [
      "6923fab12815aa89"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;