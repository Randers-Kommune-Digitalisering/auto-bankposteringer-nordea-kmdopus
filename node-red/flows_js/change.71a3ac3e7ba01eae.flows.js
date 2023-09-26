const Node = {
  "id": "71a3ac3e7ba01eae",
  "type": "change",
  "z": "d64ae6beab0c9367",
  "name": "Testregler til global konteringsregler",
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
  "y": 500,
  "wires": [
    []
  ],
  "_order": 160
}

module.exports = Node;