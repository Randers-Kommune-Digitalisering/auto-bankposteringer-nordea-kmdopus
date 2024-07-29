const Node = {
  "id": "86ccfe98bbfc82c1",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
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
      "e500eae42e2d700f"
    ],
    [
      "597ce6738ff77bef"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;