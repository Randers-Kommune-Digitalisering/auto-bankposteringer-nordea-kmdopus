const Node = {
  "id": "467fddf2a063a289",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
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
  "x": 165,
  "y": 880,
  "wires": [
    [
      "4ee43544775ac9aa"
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