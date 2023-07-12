const Node = {
  "id": "35ba1ef03eb6f044",
  "type": "change",
  "z": "97cc6bce53027f96",
  "name": "Gem msg.rules til global obj + payload",
  "rules": [
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "rules",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "rules",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 630,
  "y": 140,
  "wires": [
    [
      "26b41d06f39cca7b"
    ]
  ],
  "_order": 95
}

module.exports = Node;