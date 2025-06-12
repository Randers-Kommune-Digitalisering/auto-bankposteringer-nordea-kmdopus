const Node = {
  "id": "fe7319571f6b8a81",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "c042cd94dbdb461d",
  "name": "More pages?",
  "property": "transactions.continuationKey",
  "propertyType": "global",
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
  "y": 600,
  "wires": [
    [
      "b4e223ef99ae2ce8"
    ],
    [
      "dc02dcfb08be4b24"
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