const Node = {
  "id": "8d7669ee859a014f",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "c3855a30da38df4f",
  "name": "Bank provider?",
  "property": "configs.banking.provider",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "Nordea",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 155,
  "y": 220,
  "wires": [
    [
      "ef489047b15f8a46"
    ],
    []
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;