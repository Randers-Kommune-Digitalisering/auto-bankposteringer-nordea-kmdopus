const Node = {
  "id": "b6038d75cf47e017",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "exchange_code",
      "pt": "global",
      "to": "payload.response.code",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "adminAuthAttempt",
      "pt": "global",
      "to": "$globalContext('adminAuthAttempt') + 1",
      "tot": "jsonata"
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
  "x": 845,
  "y": 140,
  "wires": [
    [
      "d3c60cb6ef94ac01"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;