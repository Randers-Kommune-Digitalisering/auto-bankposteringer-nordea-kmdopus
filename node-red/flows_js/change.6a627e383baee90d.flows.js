const Node = {
  "id": "6a627e383baee90d",
  "type": "change",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Save transact...",
  "rules": [
    {
      "t": "set",
      "p": "transactions",
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
  "x": 1640,
  "y": 280,
  "wires": [
    [
      "125b88b4802484ea",
      "085519672b7432a6"
    ]
  ],
  "_order": 75
}

module.exports = Node;