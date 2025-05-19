const Node = {
  "id": "fec6d4e73ea4b2d2",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "b9fd86e23e147a4d",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload.accessToken",
      "pt": "msg",
      "to": "admSysData.accessToken",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.refreshToken",
      "pt": "msg",
      "to": "masterData.admSysData.refreshToken",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "masterData.admSysData",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 685,
  "y": 100,
  "wires": [
    [
      "092f29f7ebb2de04"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;