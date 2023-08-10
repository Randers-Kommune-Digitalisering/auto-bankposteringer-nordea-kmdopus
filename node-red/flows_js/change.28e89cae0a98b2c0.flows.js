const Node = {
  "id": "28e89cae0a98b2c0",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "3bdd50ac31e6a0b9",
  "name": "params",
  "rules": [
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "POST",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "path",
      "pt": "flow",
      "to": "/corporate/v2/authorize",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "content-type",
      "pt": "flow",
      "to": "application/json",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "data",
      "pt": "flow",
      "to": "{\t   \"scope\":[\t       \"ACCOUNTS_BROADBAND\"\t   ],\t   \"duration\":129600,\t   \"agreement_number\":$globalContext('agreement_id')\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "1",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 460,
  "y": 60,
  "wires": [
    [
      "6f31944caaf06a53"
    ]
  ],
  "_order": 38
}

module.exports = Node;