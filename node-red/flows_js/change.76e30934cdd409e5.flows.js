const Node = {
  "id": "76e30934cdd409e5",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "674c1f70633cac0b",
  "name": "Clear msg",
  "rules": [
    {
      "t": "delete",
      "p": "_event",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "_msgid",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "headers",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "url",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "statusCode",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "responseUrl",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "payload",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "redirectList",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "retry",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 490,
  "y": 780,
  "wires": [
    [
      "7aef3edcb149883e"
    ]
  ],
  "_order": 76
}

module.exports = Node;