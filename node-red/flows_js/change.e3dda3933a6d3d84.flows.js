const Node = {
  "id": "e3dda3933a6d3d84",
  "type": "change",
  "z": "31641b084096a0df",
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
      "p": "payload",
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
      "p": "redirectList",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "retry",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "url",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 310,
  "y": 700,
  "wires": [
    [
      "613895156063d86a"
    ]
  ],
  "_order": 69
}

module.exports = Node;