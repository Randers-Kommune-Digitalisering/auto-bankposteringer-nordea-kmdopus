const Node = {
  "id": "b303be03c07d895e",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "params, debitorkonto",
  "rules": [
    {
      "t": "set",
      "p": "query_param",
      "pt": "flow",
      "to": "DEBITORKONTO",
      "tot": "env",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 460,
  "y": 340,
  "wires": [
    [
      "9f4d5f3a190849e1"
    ]
  ],
  "_order": 182
}

module.exports = Node;