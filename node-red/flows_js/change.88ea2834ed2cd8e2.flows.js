const Node = {
  "id": "88ea2834ed2cd8e2",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "token",
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
      "p": "accessDuration",
      "pt": "global",
      "to": "payload.response.expires_in",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 495,
  "y": 400,
  "wires": [
    [
      "7be3097ce9fc8ed0"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;