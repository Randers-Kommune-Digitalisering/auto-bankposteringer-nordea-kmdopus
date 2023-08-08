const Node = {
  "id": "6f1667efc3fb53d8",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "exchange_code",
      "pt": "global",
      "to": "payload.response.code",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1250,
  "y": 240,
  "wires": [
    []
  ],
  "_order": 50
}

module.exports = Node;