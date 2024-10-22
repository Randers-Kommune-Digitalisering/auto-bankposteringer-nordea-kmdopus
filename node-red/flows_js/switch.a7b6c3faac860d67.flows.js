const Node = {
  "id": "a7b6c3faac860d67",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "9707809d7fe4863a",
  "name": "Check HTTP code from response",
  "property": "statusCode",
  "propertyType": "msg",
  "rules": [
    {
      "t": "btwn",
      "v": "500",
      "vt": "num",
      "v2": "599",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "400",
      "vt": "num",
      "v2": "499",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "200",
      "vt": "num",
      "v2": "299",
      "v2t": "num"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 3,
  "x": 115,
  "y": 460,
  "wires": [
    [
      "551dbd2ea88a85e6"
    ],
    [
      "2de2b794607f5153"
    ],
    [
      "517c1f5ec2d2b1d9"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;