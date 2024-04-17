const Node = {
  "id": "b33873bc5ca0dcfc",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
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
      "p": "query_param",
      "pt": "flow",
      "to": "access_id",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "3",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 500,
  "y": 140,
  "wires": [
    [
      "01601ddb7de735ae"
    ]
  ]
}

module.exports = Node;