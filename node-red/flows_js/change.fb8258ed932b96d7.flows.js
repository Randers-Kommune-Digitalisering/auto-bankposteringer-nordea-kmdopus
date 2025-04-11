const Node = {
  "id": "fb8258ed932b96d7",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "88a5a801e4bf7e08",
  "name": "set vars",
  "rules": [
    {
      "t": "set",
      "p": "runs.restart",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "originDate",
      "pt": "msg",
      "to": "req.params.date",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 395,
  "y": 520,
  "wires": [
    [
      "ddd06dfd6f488d21",
      "907046a328b857d3"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;