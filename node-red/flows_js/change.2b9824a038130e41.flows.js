const Node = {
  "id": "2b9824a038130e41",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "7b845d1f4aada5fa",
  "name": "Set uid to origin uid",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "runs.originUid",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 535,
  "y": 520,
  "wires": [
    [
      "a171abc6e2ae3856"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;