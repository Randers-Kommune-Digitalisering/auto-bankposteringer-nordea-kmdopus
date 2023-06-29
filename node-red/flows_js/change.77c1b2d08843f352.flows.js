const Node = {
  "id": "77c1b2d08843f352",
  "type": "change",
  "z": "c5347a17d8894f3e",
  "name": "Clear msg object",
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
  "x": 170,
  "y": 40,
  "wires": [
    [
      "3d925f06d011b63a"
    ]
  ],
  "_order": 75
}

module.exports = Node;