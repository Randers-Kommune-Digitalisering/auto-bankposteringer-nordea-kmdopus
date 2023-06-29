const Node = {
  "id": "4fcd04c4a23ce5f3",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
  "name": "Save response",
  "rules": [
    {
      "t": "set",
      "p": "client_token",
      "pt": "global",
      "to": "payload.response.client_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "access_id",
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
  "x": 1580,
  "y": 120,
  "wires": [
    []
  ],
  "_order": 67
}

module.exports = Node;