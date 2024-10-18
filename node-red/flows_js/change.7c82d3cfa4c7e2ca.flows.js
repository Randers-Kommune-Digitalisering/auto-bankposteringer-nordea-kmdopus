const Node = {
  "id": "7c82d3cfa4c7e2ca",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
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
  "x": 915,
  "y": 180,
  "wires": [
    [
      "f51a717902dc95f1"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;