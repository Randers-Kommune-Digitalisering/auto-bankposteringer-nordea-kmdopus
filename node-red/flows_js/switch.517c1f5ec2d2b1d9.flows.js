const Node = {
  "id": "517c1f5ec2d2b1d9",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "a537ba3361b4d03c",
  "name": "What is request status?",
  "property": "adminAuthStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "FAILED",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "ACTIVE",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 3,
  "x": 115,
  "y": 600,
  "wires": [
    [
      "903ed591e2732bf6"
    ],
    [
      "4e3c998f9a6def60"
    ],
    [
      "50e6621c096c9f95"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;