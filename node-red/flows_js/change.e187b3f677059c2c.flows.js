const Node = {
  "id": "e187b3f677059c2c",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "f5b0f2cb9d251540",
  "name": "Clean up globlal.transactions",
  "rules": [
    {
      "t": "delete",
      "p": "transactions.manual",
      "pt": "global"
    },
    {
      "t": "set",
      "p": "res",
      "pt": "msg",
      "to": "res",
      "tot": "flow"
    },
    {
      "t": "delete",
      "p": "res",
      "pt": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1175,
  "y": 160,
  "wires": [
    [
      "1ae55ae91ab4dbf4"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;