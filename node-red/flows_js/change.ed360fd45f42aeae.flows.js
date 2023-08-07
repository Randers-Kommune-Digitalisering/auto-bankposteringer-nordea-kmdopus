const Node = {
  "id": "ed360fd45f42aeae",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "Prod. par.",
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
      "to": "DK5908764988",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "query_param1",
      "pt": "flow",
      "to": "2023-08-04",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "query_param2",
      "pt": "flow",
      "to": "2023-08-04",
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
  "x": 740,
  "y": 320,
  "wires": [
    [
      "76f990b9c0c0cc57"
    ]
  ],
  "_order": 89
}

module.exports = Node;