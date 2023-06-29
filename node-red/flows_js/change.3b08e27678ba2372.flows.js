const Node = {
  "id": "3b08e27678ba2372",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
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
    []
  ],
  "_order": 68
}

module.exports = Node;