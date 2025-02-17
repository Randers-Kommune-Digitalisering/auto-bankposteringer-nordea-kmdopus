const Node = {
  "id": "467fddf2a063a289",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "9f0acbcfa0581c4a",
  "name": "More pages?",
  "property": "continuation_key",
  "propertyType": "flow",
  "rules": [
    {
      "t": "istype",
      "v": "string",
      "vt": "string"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 155,
  "y": 620,
  "wires": [
    [
      "e404cd51146ad2bf"
    ],
    [
      "f8442862197f5a62"
    ]
  ],
  "outputLabels": [
    "Yes",
    "No"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;