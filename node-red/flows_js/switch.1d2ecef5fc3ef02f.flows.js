const Node = {
  "id": "1d2ecef5fc3ef02f",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "ee31b70d7b508c0d",
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
  "x": 135,
  "y": 80,
  "wires": [
    [
      "8d42910b87fdded9"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;