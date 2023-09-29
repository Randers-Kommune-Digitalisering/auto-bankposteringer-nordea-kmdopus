const Node = {
  "id": "6b7d7bfa488dc986",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f51cc7b4f0bee577",
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
      "p": "query_param",
      "pt": "flow",
      "to": "access_id",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "3",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 620,
  "y": 400,
  "wires": [
    [
      "9da43c99593c5b53"
    ]
  ],
  "_order": 41
}

module.exports = Node;