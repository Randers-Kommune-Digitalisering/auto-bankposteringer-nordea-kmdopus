const Node = {
  "id": "517c1f5ec2d2b1d9",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "9707809d7fe4863a",
  "name": "What is auth status?",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "PENDING",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "FAILED",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "EXPIRED",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 4,
  "x": 105,
  "y": 400,
  "wires": [
    [
      "6ded66482c39c867"
    ],
    [
      "0a9f12d3c30f9730"
    ],
    [
      "6bca4eb11ffcecfc"
    ],
    [
      "55837b2fb22de362"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;