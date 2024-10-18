const Node = {
  "id": "e5cc1c088815a266",
  "type": "change",
  "z": "92c28da6a66fdcb3",
  "g": "42e21606623e991f",
  "name": "Make empty data structure if no inital data",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.masterData",
      "pt": "global",
      "to": "$globalContext(\"configs\").initialData.masterData ? $globalContext(\"configs\").initialData.masterData : {}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts",
      "pt": "global",
      "to": "$globalContext(\"configs\").initialData.bankAccounts ? $globalContext(\"configs\").initialData.bankAccounts : [{}]",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 475,
  "y": 80,
  "wires": [
    [
      "58216e489666bd0e"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;