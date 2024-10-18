const Node = {
  "id": "d731f7aac0b6d186",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "adminAuthStatus",
      "pt": "global",
      "to": "payload.response.status",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 915,
  "y": 140,
  "wires": [
    [
      "6b771bf2cde04fc8"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;