const Node = {
  "id": "789153d923d1ea04",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f51cc7b4f0bee577",
  "name": "💾",
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
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1130,
  "y": 280,
  "wires": [
    [
      "bba730b2711beb0a"
    ]
  ],
  "_order": 61
}

module.exports = Node;