const Node = {
  "id": "6bd349586b98125e",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "0908d601e13c4ce9",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "debitorkonto_transactions",
      "pt": "global",
      "to": "payload.response.transactions",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1210,
  "y": 160,
  "wires": [
    [
      "3da754a7823b3706"
    ]
  ],
  "_order": 179
}

module.exports = Node;