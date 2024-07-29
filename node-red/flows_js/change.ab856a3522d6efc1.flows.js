const Node = {
  "id": "ab856a3522d6efc1",
  "type": "change",
  "z": "VueExample",
  "name": "Sæt værdier",
  "rules": [
    {
      "t": "set",
      "p": "uidFromObj",
      "pt": "msg",
      "to": "payload.id",
      "tot": "msg"
    },
    {
      "t": "delete",
      "p": "payload.id",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 384,
  "y": 705,
  "wires": [
    []
  ]
}

module.exports = Node;