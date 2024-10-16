const Node = {
  "id": "9ad5392beeb7a718",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "ea1bf65dfedc00a0",
  "name": "",
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
  "x": 115,
  "y": 1300,
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