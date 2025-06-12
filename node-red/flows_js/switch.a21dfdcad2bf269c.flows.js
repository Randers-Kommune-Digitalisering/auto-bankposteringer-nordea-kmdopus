const Node = {
  "id": "a21dfdcad2bf269c",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "Remake postings?",
  "property": "runs.remake",
  "propertyType": "global",
  "rules": [
    {
      "t": "true"
    },
    {
      "t": "istype",
      "v": "undefined",
      "vt": "undefined"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 3,
  "x": 505,
  "y": 400,
  "wires": [
    [
      "e18a99f198df3d2b"
    ],
    [
      "d23154f60d923ee9"
    ],
    [
      "d23154f60d923ee9"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;