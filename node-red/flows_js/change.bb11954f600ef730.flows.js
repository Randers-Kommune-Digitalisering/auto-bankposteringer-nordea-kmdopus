const Node = {
  "id": "bb11954f600ef730",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "Flow vars",
  "rules": [
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "GET",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "path",
      "pt": "flow",
      "to": "/corporate/premium/v4/accounts",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "pathSuffix",
      "pt": "flow",
      "to": "/transactions",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "urlParam",
      "pt": "flow",
      "to": "selectedAccount.bankAccount",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "queryParam1",
      "pt": "flow",
      "to": "dates.bookingDate",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "queryParam2",
      "pt": "flow",
      "to": "queryParam1",
      "tot": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 275,
  "y": 460,
  "wires": [
    [
      "c3fd47014b3397d6"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;