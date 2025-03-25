const Node = {
  "id": "c85ba2f69453a4f2",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "c0daad82a0a61571",
  "name": "Create status object",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{ \"success\": true }",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 105,
  "y": 860,
  "wires": [
    [
      "7aa893cfddc7abd2"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;