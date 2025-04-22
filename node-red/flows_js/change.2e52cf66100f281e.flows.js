const Node = {
  "id": "2e52cf66100f281e",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f20ee67701d7b737",
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
  "x": 235,
  "y": 240,
  "wires": [
    [
      "c5321441d9724e5a"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;