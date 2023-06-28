const Node = {
  "id": "5a4da2187f4841ac",
  "type": "change",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Save response",
  "rules": [
    {
      "t": "set",
      "p": "exchange_code",
      "pt": "global",
      "to": "payload.response.code",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1640,
  "y": 200,
  "wires": [
    [
      "16f473e8921a2a39"
    ]
  ],
  "_order": 72
}

module.exports = Node;