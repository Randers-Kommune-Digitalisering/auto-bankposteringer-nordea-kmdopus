const Node = {
  "id": "292a471828290638",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f51cc7b4f0bee577",
  "name": "💾",
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
  "x": 1250,
  "y": 300,
  "wires": [
    [
      "7576604482a369d5"
    ]
  ],
  "_order": 132
}

module.exports = Node;