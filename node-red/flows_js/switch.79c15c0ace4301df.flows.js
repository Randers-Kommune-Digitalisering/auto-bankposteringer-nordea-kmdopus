const Node = {
  "id": "79c15c0ace4301df",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "manual postings?",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "istype",
      "v": "undefined",
      "vt": "undefined"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 655,
  "y": 380,
  "wires": [
    [
      "76c02b9387861543"
    ],
    [
      "d1d1c1aa6183e98d",
      "76c02b9387861543"
    ]
  ],
  "outputLabels": [
    "false",
    "true"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;