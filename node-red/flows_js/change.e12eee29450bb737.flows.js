const Node = {
  "id": "e12eee29450bb737",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "masterData.admSysData.accessToken",
      "pt": "global",
      "to": "payload.response.access_token ? payload.response.access_token : $globalContext('masterData').admSysData.accessToken",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "masterData.admSysData.refreshToken",
      "pt": "global",
      "to": "payload.response.refresh_token ? payload.response.refresh_token : $globalContext('masterData').admSysData.refreshToken",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "auth.adminStatus",
      "pt": "global",
      "to": "payload.response.access_token ? \"COMPLETED\" : \"FAILED\"",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 300,
  "wires": [
    [
      "be1b2d52d0b2ecce",
      "c84f4aea4f8aa663"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;