const Node = {
  "id": "7a9c780ed742f3c1",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
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
      "to": "{\t   \"scope\":[\t       \"ACCOUNTS_BROADBAND\"\t   ],\t   \"duration\":129600,\t   \"agreement_number\":$flowContext('agreement_id')\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "1",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 620,
  "y": 60,
  "wires": [
    [
      "582fcaa0daa95fd5"
    ]
  ],
  "_order": 126
}

module.exports = Node;