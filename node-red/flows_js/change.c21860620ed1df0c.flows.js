const Node = {
  "id": "c21860620ed1df0c",
  "type": "change",
  "z": "a1dc9966e881ac6b",
  "g": "f12143aada45b8f0",
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
      "b0b85e71c34419f2",
      "886fb01e4472a983",
      "0b9d5c36a1ef56f9",
      "31f61520f4092102"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;