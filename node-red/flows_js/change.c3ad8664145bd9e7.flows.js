const Node = {
  "id": "c3ad8664145bd9e7",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Delete vars",
  "rules": [
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
    },
    {
      "t": "delete",
      "p": "headers",
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
  "x": 545,
  "y": 120,
  "wires": [
    [
      "3ef5950022367cc1"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;