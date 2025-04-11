const Node = {
  "id": "d0b4f25aa6dd9eda",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "ea1bf65dfedc00a0",
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
  "y": 580,
  "wires": [
    [
      "0c3e96f69a239147"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;