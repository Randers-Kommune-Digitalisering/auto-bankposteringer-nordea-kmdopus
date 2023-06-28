const Node = {
  "id": "3f53c86f7c271419",
  "type": "change",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Save response",
  "rules": [
    {
      "t": "set",
      "p": "access_token",
      "pt": "global",
      "to": "payload.response.access_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "refresh_token",
      "pt": "global",
      "to": "payload.response.refresh_token",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1640,
  "y": 240,
  "wires": [
    [
      "614955044e2dc328"
    ]
  ],
  "_order": 73
}

module.exports = Node;