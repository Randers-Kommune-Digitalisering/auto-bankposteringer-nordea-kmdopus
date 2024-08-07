const Node = {
  "id": "6969d044c384ad32",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "82b295d9c460f500",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "headers",
      "pt": "msg",
      "to": "{\t    \"Content-Disposition\": \"attachment;filename=\" & req.params.file,\t    \"Content-Type\": \"text/csv;charset=utf-8\"\t}",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 295,
  "y": 720,
  "wires": [
    [
      "e4d22cea9cad1edf"
    ]
  ],
  "l": false
}

module.exports = Node;