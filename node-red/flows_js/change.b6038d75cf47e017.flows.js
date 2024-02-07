const Node = {
  "id": "b6038d75cf47e017",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "exchange_code",
      "pt": "flow",
      "to": "payload.response.code",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "request_status",
      "pt": "flow",
      "to": "payload.response.status",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1110,
  "y": 140,
  "wires": [
    [
      "f85f9d2570988531"
    ]
  ],
  "_order": 135
}

module.exports = Node;