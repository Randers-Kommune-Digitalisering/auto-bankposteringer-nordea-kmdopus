const Node = {
  "id": "c299a1f94979dbb1",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "1b0a88a05194f18e",
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
      "06bc7c5f0e218323"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;