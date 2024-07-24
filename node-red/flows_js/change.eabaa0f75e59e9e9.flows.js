const Node = {
  "id": "eabaa0f75e59e9e9",
  "type": "change",
  "z": "73d7d240a587aa11",
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
      "b576def25a775a9f"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;