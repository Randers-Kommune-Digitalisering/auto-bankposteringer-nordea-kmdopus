const Node = {
  "id": "1e78aff4a7fc27c0",
  "type": "change",
  "z": "d64ae6beab0c9367",
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
  "y": 280,
  "wires": [
    [
      "32fc9c076fab6080"
    ]
  ],
  "_order": 149
}

module.exports = Node;