const Node = {
  "id": "55837b2fb22de362",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "9707809d7fe4863a",
  "name": "What is auth status?",
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
  "x": 155,
  "y": 440,
  "wires": [
    [
      "6668cc6605749844"
    ],
    [
      "0a9f12d3c30f9730"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;