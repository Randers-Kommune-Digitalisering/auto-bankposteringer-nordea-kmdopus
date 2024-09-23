const Node = {
  "id": "c299a1f94979dbb1",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "8b39791da44fdf1f",
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
  "x": 225,
  "y": 860,
  "wires": [
    [
      "06bc7c5f0e218323"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;