const Node = {
  "id": "bf90bac8573844be",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "auth.adminStatus",
      "pt": "global",
      "to": "payload.response.status",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "masterData.admSysData.accessToken",
      "pt": "global",
      "to": "payload.response.code ? payload.response.code : $globalContext('masterData').admSysData.accessToken",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 260,
  "wires": [
    [
      "7cd5ad1899b477c4"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;