const Node = {
  "id": "3d7aad0174b40bab",
  "type": "change",
  "z": "47254dd1b3ed3b06",
  "g": "953f47b9965b1079",
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
      "af39499baa34661d",
      "7e0104b998f9057d",
      "aa6f233951945b6d",
      "68742e88f51c8eac"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;