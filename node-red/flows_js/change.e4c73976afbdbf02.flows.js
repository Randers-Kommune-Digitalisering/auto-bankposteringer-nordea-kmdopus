const Node = {
  "id": "e4c73976afbdbf02",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "f534018c3e81dbd9",
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
  "x": 1255,
  "y": 240,
  "wires": [
    [
      "a478a1b89e691835"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;