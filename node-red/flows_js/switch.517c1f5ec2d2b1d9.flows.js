const Node = {
  "id": "517c1f5ec2d2b1d9",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "9707809d7fe4863a",
  "name": "What is auth status?",
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
      "v": "PENDING",
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
  "y": 500,
  "wires": [
    [
      "2de2b794607f5153"
    ],
    [
      "6ded66482c39c867"
    ],
    [
      "6668cc6605749844"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;