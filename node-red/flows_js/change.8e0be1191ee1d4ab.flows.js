const Node = {
  "id": "8e0be1191ee1d4ab",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "73b9b3deaf04ef3b",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "topic",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "_msgid",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "payload",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "headers",
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
    },
    {
      "t": "delete",
      "p": "filename",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "columns",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "sql",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "data",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "urlParam",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "queryParam1",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "queryParam2",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "pathSuffix",
      "pt": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 155,
  "y": 460,
  "wires": [
    [
      "0dce993c4dd47043"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;