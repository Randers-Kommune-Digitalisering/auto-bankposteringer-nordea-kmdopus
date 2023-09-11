const Node = {
  "id": "ed37101d4b84ae95",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "9624c5429dc0adc3",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "accounts",
      "pt": "global",
      "to": "payload.response.accounts",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1130,
  "y": 980,
  "wires": [
    [
      "5615093b8ff0f867"
    ]
  ],
  "_order": 124
}

module.exports = Node;