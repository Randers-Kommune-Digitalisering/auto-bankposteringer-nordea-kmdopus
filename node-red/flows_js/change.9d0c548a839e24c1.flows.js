const Node = {
  "id": "9d0c548a839e24c1",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "7b845d1f4aada5fa",
  "name": "Clean runs obj",
  "rules": [
    {
      "t": "delete",
      "p": "runs.originUid",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "runs.originDate",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "runs.originStatusCode",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "runs.restart",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "runs.remake",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 785,
  "y": 600,
  "wires": [
    [
      "56c6b2cd9b4261ad"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;