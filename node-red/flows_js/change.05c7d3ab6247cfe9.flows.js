const Node = {
  "id": "05c7d3ab6247cfe9",
  "type": "change",
  "z": "d4c4c4565d1e740c",
  "g": "6ea0a2cdaaa1c772",
  "name": "Rens objekt",
  "rules": [
    {
      "t": "delete",
      "p": "host",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "port",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "database",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "username",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "password",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "sql",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 570,
  "y": 140,
  "wires": [
    [
      "0161c8def3dab74f"
    ]
  ],
  "_order": 106
}

module.exports = Node;