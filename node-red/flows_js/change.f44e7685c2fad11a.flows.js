const Node = {
  "id": "f44e7685c2fad11a",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "430c5bb113381f0a",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload.admName",
      "pt": "msg",
      "to": "masterData.admName",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.admEmail",
      "pt": "msg",
      "to": "masterData.admEmail",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.admID",
      "pt": "msg",
      "to": "masterData.admID",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.erpSystem",
      "pt": "msg",
      "to": "masterData.erpSystem",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload.integrationBool",
      "pt": "msg",
      "to": "masterData.integrationBool",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 645,
  "y": 340,
  "wires": [
    [
      "d4b976cf408bbba7"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;