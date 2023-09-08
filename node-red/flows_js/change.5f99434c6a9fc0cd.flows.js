const Node = {
  "id": "5f99434c6a9fc0cd",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "3bdd50ac31e6a0b9",
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
      "to": "/corporate/premium/v4/accounts",
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
      "to": "KONTO",
      "tot": "env"
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
  "x": 460,
  "y": 220,
  "wires": [
    [
      "76f990b9c0c0cc57"
    ]
  ],
  "_order": 56
}

module.exports = Node;