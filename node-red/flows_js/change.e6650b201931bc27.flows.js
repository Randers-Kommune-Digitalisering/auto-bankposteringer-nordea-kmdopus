const Node = {
  "id": "e6650b201931bc27",
  "type": "change",
  "z": "92c28da6a66fdcb3",
  "g": "fd6f2c60431b8b55",
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
  "x": 715,
  "y": 100,
  "wires": [
    [
      "9eefcaa37540b844"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;