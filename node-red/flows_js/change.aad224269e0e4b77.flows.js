const Node = {
  "id": "aad224269e0e4b77",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
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
  "x": 1580,
  "y": 280,
  "wires": [
    [
      "7783d005ab670e91"
    ]
  ],
  "_order": 60
}

module.exports = Node;