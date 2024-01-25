const Node = {
  "id": "292a471828290638",
  "type": "change",
  "z": "5a8afc5afb89916f",
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
  "y": 60,
  "wires": [
    [
      "7576604482a369d5"
    ]
  ],
  "_order": 177
}

module.exports = Node;