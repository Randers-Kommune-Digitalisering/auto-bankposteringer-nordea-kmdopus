const Node = {
  "id": "e5cc1c088815a266",
  "type": "change",
  "z": "92c28da6a66fdcb3",
  "g": "42e21606623e991f",
  "name": "Initiate db tables",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.masterData",
      "pt": "global",
      "to": "[{}]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts",
      "pt": "global",
      "to": "[{}]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData",
      "pt": "global",
      "to": "[{}]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 585,
  "y": 80,
  "wires": [
    [
      "19f998658c30306b",
      "dbc52ef3ec740e48"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;