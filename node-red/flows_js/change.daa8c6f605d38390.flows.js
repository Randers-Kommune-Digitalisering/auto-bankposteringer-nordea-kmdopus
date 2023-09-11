const Node = {
  "id": "daa8c6f605d38390",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "9624c5429dc0adc3",
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
  "y": 980,
  "wires": [
    [
      "9a9cf72f06e02c07"
    ]
  ],
  "_order": 119
}

module.exports = Node;