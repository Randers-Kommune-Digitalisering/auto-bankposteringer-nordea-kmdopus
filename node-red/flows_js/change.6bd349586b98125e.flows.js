const Node = {
  "id": "6bd349586b98125e",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "1c77fa2eb47442fd",
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
  "x": 1270,
  "y": 120,
  "wires": [
    [
      "3da754a7823b3706",
      "7f564fcbffa44323"
    ]
  ],
  "_order": 229
}

module.exports = Node;