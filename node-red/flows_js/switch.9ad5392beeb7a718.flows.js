const Node = {
  "id": "9ad5392beeb7a718",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "ea1bf65dfedc00a0",
  "name": "statusCode",
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
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 685,
  "y": 620,
  "wires": [
    [
      "64c4dc94baea05d0"
    ],
    [
      "f2662eb9b7faafdc"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;