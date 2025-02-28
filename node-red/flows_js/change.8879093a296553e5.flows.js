const Node = {
  "id": "8879093a296553e5",
  "type": "change",
  "z": "a1dc9966e881ac6b",
  "g": "260ec49abb2a1b5b",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "configs.initialData",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "configs.database",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "isInitializing",
      "pt": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 505,
  "y": 100,
  "wires": [
    [
      "d656d05e3a263b7e"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;