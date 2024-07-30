const Node = {
  "id": "f1cf936b3b616f38",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "admName",
      "pt": "msg",
      "to": "admName",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "admEmail",
      "pt": "msg",
      "to": "admEmail",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "admID",
      "pt": "msg",
      "to": "admID",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "erpSystem",
      "pt": "msg",
      "to": "erpSystem",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{\t   \"admName\": admName,\t   \"admEmail\": admEmail,\t   \"admID\": admID,\t   \"erpSystem\": erpSystem\t}",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 380,
  "y": 980,
  "wires": [
    [
      "12a49342f9b97221"
    ]
  ]
}

module.exports = Node;