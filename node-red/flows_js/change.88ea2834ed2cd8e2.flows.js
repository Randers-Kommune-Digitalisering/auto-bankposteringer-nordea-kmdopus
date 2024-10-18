const Node = {
  "id": "88ea2834ed2cd8e2",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "access_token",
      "pt": "global",
      "to": "payload.response.access_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "refresh_token",
      "pt": "global",
      "to": "payload.response.refresh_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "adminAuthStatus",
      "pt": "global",
      "to": "COMPLETE",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 915,
  "y": 220,
  "wires": [
    [
      "76ecefa08ed982c6"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;