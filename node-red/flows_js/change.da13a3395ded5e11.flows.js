const Node = {
  "id": "da13a3395ded5e11",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
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
      "to": "selected_bank_account",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "queryParam1",
      "pt": "flow",
      "to": "startdate",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "queryParam2",
      "pt": "flow",
      "to": "enddate",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 595,
  "y": 260,
  "wires": [
    [
      "632cc65c2df51983"
    ]
  ],
  "icon": "font-awesome/fa-cogs",
  "l": false
}

module.exports = Node;