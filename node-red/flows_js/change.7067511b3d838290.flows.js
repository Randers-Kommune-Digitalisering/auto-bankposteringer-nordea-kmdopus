const Node = {
  "id": "7067511b3d838290",
  "type": "change",
  "z": "VueExample",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "admName",
      "pt": "global",
      "to": "payload.admName",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "admEmail",
      "pt": "global",
      "to": "payload.admEmail",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "admID",
      "pt": "global",
      "to": "payload.admID",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "erpSystem",
      "pt": "global",
      "to": "payload.erpSystem",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "integrationBool",
      "pt": "global",
      "to": "payload.integrationBool",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{\t   \"admName\": admName,\t   \"admEmail\": admEmail,\t   \"admID\": admID,\t   \"erpSystem\": erpSystem,\t   \"integrationBool\": integrationBool\t}",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 380,
  "y": 1040,
  "wires": [
    [
      "9e3c71ae2dbb08c6"
    ]
  ]
}

module.exports = Node;