const Node = {
  "id": "3d982b4ced1f1f9c",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "3bdd50ac31e6a0b9",
  "name": "💾",
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
  "x": 970,
  "y": 220,
  "wires": [
    [
      "7a010432a362d193"
    ]
  ],
  "_order": 64
}

module.exports = Node;