const Node = {
  "id": "e5cc1c088815a266",
  "type": "change",
  "z": "431f85f122b4636d",
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
  "x": 95,
  "y": 200,
  "wires": [
    [
      "0e448630b02f5e41",
      "670f9430c590cdc5"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;