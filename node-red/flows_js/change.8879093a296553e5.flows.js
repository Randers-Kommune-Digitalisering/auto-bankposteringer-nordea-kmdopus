const Node = {
  "id": "8879093a296553e5",
  "type": "change",
  "z": "a1dc9966e881ac6b",
  "g": "260ec49abb2a1b5b",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "isInitializing",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "configs.initialData",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 525,
  "y": 100,
  "wires": [
    [
      "1f3de979ddd94bc2",
      "02b56a95e132bf77",
      "60b5ebfc1eed92a7"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;