const Node = {
  "id": "e4d22cea9cad1edf",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "82b295d9c460f500",
  "name": "file path",
  "rules": [
    {
      "t": "set",
      "p": "fileRequested",
      "pt": "msg",
      "to": "req.params.file",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "filepath",
      "pt": "msg",
      "to": "\"/data/output/\" & fileRequested",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 340,
  "y": 680,
  "wires": [
    [
      "45f0772187dd572e"
    ]
  ]
}

module.exports = Node;