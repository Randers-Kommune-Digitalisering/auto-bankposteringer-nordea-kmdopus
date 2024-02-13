const Node = {
  "id": "b698110150769236",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "transactions",
      "pt": "flow",
      "to": "payload.response.transactions",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 870,
  "y": 320,
  "wires": [
    [
      "e8bdcba5b1e438ba"
    ]
  ],
  "_order": 184
}

module.exports = Node;