const Node = {
  "id": "b698110150769236",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "debitorkonto_transactions",
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
  "x": 1150,
  "y": 360,
  "wires": [
    [
      "0abc6f6a12829cae",
      "f850f9e3f6eff63d"
    ]
  ],
  "_order": 232
}

module.exports = Node;