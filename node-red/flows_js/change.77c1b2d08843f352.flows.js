const Node = {
  "id": "77c1b2d08843f352",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "67c340b82556b251",
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
  "x": 170,
  "y": 440,
  "wires": [
    [
      "84f9353769a4a1f6"
    ]
  ],
  "_order": 75
}

module.exports = Node;