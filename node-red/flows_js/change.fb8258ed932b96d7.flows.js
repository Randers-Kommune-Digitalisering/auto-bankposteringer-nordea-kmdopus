const Node = {
  "id": "fb8258ed932b96d7",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "9b2beb35be5bbb31",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "isRestart",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "restartUid",
      "pt": "global",
      "to": "uid",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "date",
      "pt": "global",
      "to": "dato",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 165,
  "y": 160,
  "wires": [
    [
      "19a9e954c5d433ab",
      "8553c6ad958744e2"
    ]
  ],
  "l": false
}

module.exports = Node;