const Node = {
  "id": "123656358b9bc345",
  "type": "change",
  "z": "97cc6bce53027f96",
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
  "_order": 103
}

module.exports = Node;