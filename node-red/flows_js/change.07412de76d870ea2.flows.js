const Node = {
  "id": "07412de76d870ea2",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 715,
  "y": 180,
  "wires": [
    [
      "dc01ad5aef23542a"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;