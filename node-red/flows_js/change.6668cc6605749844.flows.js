const Node = {
  "id": "6668cc6605749844",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "9707809d7fe4863a",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "payload",
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
  "x": 215,
  "y": 440,
  "wires": [
    [
      "5e98d83c4a1fa3c6"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;