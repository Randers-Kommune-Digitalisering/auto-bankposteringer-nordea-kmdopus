const Node = {
  "id": "14e9f5f075a380e1",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 220,
  "wires": [
    [
      "7cd5ad1899b477c4"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;