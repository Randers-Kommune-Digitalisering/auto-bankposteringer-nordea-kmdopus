const Node = {
  "id": "152b9c2d37694a5e",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "client_token",
      "pt": "global",
      "to": "payload.response.client_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "access_id",
      "pt": "global",
      "to": "payload.response.access_id",
      "tot": "msg"
    },
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
  "y": 100,
  "wires": [
    [
      "a1d02033c5b07c48"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;