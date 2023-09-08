const Node = {
  "id": "dc6c4cab7bce68b7",
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
  "x": 460,
  "y": 140,
  "wires": [
    [
      "05fbddb7dfca7aaa"
    ]
  ],
  "_order": 42
}

module.exports = Node;