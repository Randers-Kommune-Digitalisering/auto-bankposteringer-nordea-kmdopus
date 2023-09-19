const Node = {
  "id": "a9408e01bf560676",
  "type": "change",
  "z": "d64ae6beab0c9367",
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
      "2c1387705bad56b5"
    ]
  ],
  "_order": 173
}

module.exports = Node;