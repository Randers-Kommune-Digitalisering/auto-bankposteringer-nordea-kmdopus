const Node = {
  "id": "3ef5950022367cc1",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "d35c0446ba72295e",
  "name": "Step checker",
  "property": "step",
  "propertyType": "flow",
  "rules": [
    {
      "t": "eq",
      "v": "0",
      "vt": "num"
    },
    {
      "t": "eq",
      "v": "1",
      "vt": "num"
    },
    {
      "t": "eq",
      "v": "2",
      "vt": "num"
    },
    {
      "t": "eq",
      "v": "3",
      "vt": "num"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 4,
  "x": 595,
  "y": 120,
  "wires": [
    [
      "0db12710e10faee7"
    ],
    [
      "882cf7b227b32e19"
    ],
    [
      "50398a5a5e23035b"
    ],
    [
      "340158f8fba97490"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;