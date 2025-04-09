const Node = {
  "id": "a7b6c3faac860d67",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "9707809d7fe4863a",
  "name": "Check HTTP code from response",
  "property": "statusCode",
  "propertyType": "msg",
  "rules": [
    {
      "t": "btwn",
      "v": "200",
      "vt": "num",
      "v2": "299",
      "v2t": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 105,
  "y": 400,
  "wires": [
    [
      "517c1f5ec2d2b1d9"
    ],
    [
      "0a9f12d3c30f9730"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;