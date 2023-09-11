const Node = {
  "id": "4c07ef299f53feaf",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "g": "a72cb7bc6d1977da",
  "name": "Regler til msg",
  "rules": [
    {
      "t": "set",
      "p": "payload.rules",
      "pt": "msg",
      "to": "konteringsregler",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 140,
  "y": 100,
  "wires": [
    [
      "e052c9178d60cec6"
    ]
  ],
  "_order": 128
}

module.exports = Node;