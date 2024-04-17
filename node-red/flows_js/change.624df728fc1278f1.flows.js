const Node = {
  "id": "624df728fc1278f1",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "client_token",
      "pt": "global",
      "to": "payload.response.client_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "access_id",
      "pt": "global",
      "to": "payload.response.access_id",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 870,
  "y": 60,
  "wires": [
    [
      "899fa423dc131ca8"
    ]
  ]
}

module.exports = Node;