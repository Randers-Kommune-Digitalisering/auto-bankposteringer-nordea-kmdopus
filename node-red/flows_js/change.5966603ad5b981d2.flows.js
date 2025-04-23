const Node = {
  "id": "5966603ad5b981d2",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "set request data",
  "rules": [
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "1",
      "tot": "num"
    },
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
      "p": "accessDuration",
      "pt": "flow",
      "to": "129600",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "data",
      "pt": "flow",
      "to": "{\t   \"scope\":[\t       \"ACCOUNTS_BROADBAND\"\t   ],\t   \"duration\":$flowContext(\"accessDuration\"),\t   \"agreement_number\":$globalContext(\"configs\").banking.agreement\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "url",
      "pt": "msg",
      "to": "$globalContext(\"configs\").banking.domain & $flowContext(\"path\")",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 180,
  "wires": [
    [
      "2f7f5e5bdcdec602"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;