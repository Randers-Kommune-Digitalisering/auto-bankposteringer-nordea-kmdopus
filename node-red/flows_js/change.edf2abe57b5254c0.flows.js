const Node = {
  "id": "edf2abe57b5254c0",
  "type": "change",
  "z": "97cc6bce53027f96",
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
      "ecb62d79eca7028c"
    ]
  ],
  "_order": 99
}

module.exports = Node;