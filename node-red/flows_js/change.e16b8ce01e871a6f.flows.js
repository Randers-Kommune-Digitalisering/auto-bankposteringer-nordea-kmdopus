const Node = {
  "id": "e16b8ce01e871a6f",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "73b9b3deaf04ef3b",
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
      "to": "transactions.selectedAccount.bankAccount",
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
  "x": 255,
  "y": 460,
  "wires": [
    [
      "ebe6c0a88a263b43"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;