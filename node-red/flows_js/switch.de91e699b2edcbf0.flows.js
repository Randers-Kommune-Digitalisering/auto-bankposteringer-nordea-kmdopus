const Node = {
  "id": "de91e699b2edcbf0",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "postings generated?",
  "property": "erp.postings",
  "propertyType": "global",
  "rules": [
    {
      "t": "nempty"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 505,
  "y": 220,
  "wires": [
    [
      "124c0d3fd352bd92"
    ],
    [
      "a4e64ff4f2713cec"
    ]
  ],
  "outputLabels": [
    "true",
    "false"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;