const Node = {
  "id": "fb8258ed932b96d7",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "9b2beb35be5bbb31",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "date",
      "pt": "global",
      "to": "originDate",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "runRestart",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 175,
  "y": 200,
  "wires": [
    [
      "497a8a8d75494096"
    ]
  ],
  "l": false
}

module.exports = Node;