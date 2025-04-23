const Node = {
  "id": "547579249e32e3ec",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "340a8358eb5b957c",
  "name": "Clean vars",
  "rules": [
    {
      "t": "delete",
      "p": "transactions.list",
      "pt": "global"
    },
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "null",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "statusCode",
      "pt": "msg",
      "to": "null",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 175,
  "y": 60,
  "wires": [
    [
      "9068945792b1f486"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;