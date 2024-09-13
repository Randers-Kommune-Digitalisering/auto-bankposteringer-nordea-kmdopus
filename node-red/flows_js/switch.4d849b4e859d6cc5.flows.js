const Node = {
  "id": "4d849b4e859d6cc5",
  "type": "switch",
  "z": "431f85f122b4636d",
  "name": "Should rules be imported from a file?",
  "property": "configs.initialData.rulesToImportFromFile",
  "propertyType": "global",
  "rules": [
    {
      "t": "false"
    },
    {
      "t": "true"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 95,
  "y": 320,
  "wires": [
    [
      "10babf314f8bbe34"
    ],
    [
      "482560c1214eacde"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;