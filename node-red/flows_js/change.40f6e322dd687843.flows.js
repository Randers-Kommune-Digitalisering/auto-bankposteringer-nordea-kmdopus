const Node = {
  "id": "40f6e322dd687843",
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
      "to": "payload.response.client_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "auth.accessId",
      "pt": "global",
      "to": "payload.response.access_id",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 180,
  "wires": [
    [
      "7cd5ad1899b477c4"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;