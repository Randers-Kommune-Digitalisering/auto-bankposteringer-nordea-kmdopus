const Node = {
  "id": "84f96049f46a03fd",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "622bd279325fcb5d",
  "name": "",
  "property": "configs.banking.provider",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "Nordea",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 165,
  "y": 60,
  "wires": [
    [
      "1d6ee10f975dab9d"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;