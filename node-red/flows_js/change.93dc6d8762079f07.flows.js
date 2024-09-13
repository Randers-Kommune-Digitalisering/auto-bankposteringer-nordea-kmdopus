const Node = {
  "id": "93dc6d8762079f07",
  "type": "change",
  "z": "2d5de3ec9a4f11b6",
  "g": "1e0e1f57083661ef",
  "name": "build msg",
  "rules": [
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "erpFileHeaders",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "nomatch_transactions",
      "pt": "flow",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 840,
  "y": 60,
  "wires": [
    [
      "133b79f161c6fdb3"
    ]
  ]
}

module.exports = Node;