const Node = {
  "id": "d3ab108167e9cf9c",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "54ef3083f50853f1",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "sql",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "req",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "res",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "uid",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 155,
  "y": 80,
  "wires": [
    [
      "65984a50da4fd189"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;