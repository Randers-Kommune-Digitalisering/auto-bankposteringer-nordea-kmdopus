const Node = {
  "id": "0db12710e10faee7",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
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
      "p": "data",
      "pt": "flow",
      "to": "{\t   \"scope\":[\t       \"ACCOUNTS_BROADBAND\"\t   ],\t   \"duration\":129600,\t   \"agreement_number\":$env('AGREEMENT_ID')\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "url",
      "pt": "msg",
      "to": "$flowContext(\"banking_domain\") & $flowContext(\"path\")",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 645,
  "y": 60,
  "wires": [
    [
      "bb2aebcebb495b0f"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;