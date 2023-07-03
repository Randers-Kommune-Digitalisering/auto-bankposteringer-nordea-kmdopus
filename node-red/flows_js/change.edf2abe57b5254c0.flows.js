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
  "x": 380,
  "y": 540,
  "wires": [
    [
      "ecb62d79eca7028c"
    ]
  ],
  "_order": 94
}

module.exports = Node;