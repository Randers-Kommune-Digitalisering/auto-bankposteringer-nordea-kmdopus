const Node = {
  "id": "682b9333052f2d31",
  "type": "change",
  "z": "aff40520a8419466",
  "name": "Gem JSON Array i msg.konteringsregler",
  "rules": [
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 360,
  "y": 180,
  "wires": [
    [
      "82d1b48762c80e74",
      "30a1d734cd84805b"
    ]
  ],
  "_order": 82
}

module.exports = Node;