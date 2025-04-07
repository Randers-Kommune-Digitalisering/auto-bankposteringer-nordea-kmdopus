const Node = {
  "id": "152b9c2d37694a5e",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "auth.token",
      "pt": "global",
      "to": "payload.response.client_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "auth.accessId",
      "pt": "global",
      "to": "payload.response.access_id",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "auth.adminStatus",
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
  "x": 495,
  "y": 180,
  "wires": [
    [
      "57ebed6f23b4abbd"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;