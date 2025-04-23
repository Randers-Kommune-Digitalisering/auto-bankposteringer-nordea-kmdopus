const Node = {
  "id": "2a8b97e63cdd093b",
  "type": "change",
  "z": "47254dd1b3ed3b06",
  "g": "60cd8e62fc1af937",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "isInitializing",
      "pt": "flow",
      "to": "true",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "dates",
      "pt": "global",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "masterData",
      "pt": "global",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "runs",
      "pt": "global",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "transactions",
      "pt": "global",
      "to": "{}",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 115,
  "y": 100,
  "wires": [
    [
      "00d6fa8f0f3a208e",
      "37f5f69d00051c04",
      "0e1e9cd00ffb2349",
      "1521029cab2d74e1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;