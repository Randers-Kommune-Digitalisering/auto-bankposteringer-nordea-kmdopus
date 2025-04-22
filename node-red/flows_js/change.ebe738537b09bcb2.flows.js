const Node = {
  "id": "ebe738537b09bcb2",
  "type": "change",
  "z": "0715142e73ad87d8",
  "name": "Clean",
  "rules": [
    {
      "t": "delete",
      "p": "error",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "tablename",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "config",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 80,
  "wires": [
    [
      "be9543bf89f4293d"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;