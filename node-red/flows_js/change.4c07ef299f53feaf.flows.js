const Node = {
  "id": "4c07ef299f53feaf",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "name": "konteringsregler til msg obj",
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
  "x": 300,
  "y": 140,
  "wires": [
    [
      "e052c9178d60cec6"
    ]
  ],
  "_order": 107
}

module.exports = Node;