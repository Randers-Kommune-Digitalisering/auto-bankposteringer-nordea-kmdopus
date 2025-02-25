const Node = {
  "id": "1d2ecef5fc3ef02f",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "ee31b70d7b508c0d",
  "name": "Bank provider",
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
  "x": 125,
  "y": 480,
  "wires": [
    [
      "90ef9573a5cdf3d6"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;