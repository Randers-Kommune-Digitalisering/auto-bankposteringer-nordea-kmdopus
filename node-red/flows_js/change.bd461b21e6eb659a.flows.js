const Node = {
  "id": "bd461b21e6eb659a",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "9b2beb35be5bbb31",
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
  "x": 125,
  "y": 60,
  "wires": [
    [
      "497a8a8d75494096"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;