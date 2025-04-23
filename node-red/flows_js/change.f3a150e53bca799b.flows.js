const Node = {
  "id": "f3a150e53bca799b",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "7b845d1f4aada5fa",
  "name": "Set new uid",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "transactions.uid",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 535,
  "y": 380,
  "wires": [
    [
      "a171abc6e2ae3856"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;