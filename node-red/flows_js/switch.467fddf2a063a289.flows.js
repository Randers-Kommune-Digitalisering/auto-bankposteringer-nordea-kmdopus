const Node = {
  "id": "467fddf2a063a289",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "All pages requested?",
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
  "x": 795,
  "y": 300,
  "wires": [
    [
      "8f2eaebbbfb89bac"
    ],
    [
      "f8442862197f5a62"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;