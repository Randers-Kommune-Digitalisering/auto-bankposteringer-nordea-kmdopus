const Node = {
  "id": "68079c74979ba90f",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f3a6b40b4a2788e0",
  "name": "params",
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
      "to": "/corporate/premium/v3/accounts",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "path_suffix",
      "pt": "flow",
      "to": "/transactions",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "query_param",
      "pt": "flow",
      "to": "DEBITORKONTO",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "query_param1",
      "pt": "flow",
      "to": "2023-09-07",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "query_param2",
      "pt": "flow",
      "to": "2023-09-07",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "5",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 620,
  "y": 180,
  "wires": [
    [
      "083b9364e69ceb5c"
    ]
  ],
  "_order": 107
}

module.exports = Node;