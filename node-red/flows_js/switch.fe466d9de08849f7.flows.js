const Node = {
  "id": "fe466d9de08849f7",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "340a8358eb5b957c",
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
  "x": 425,
  "y": 100,
  "wires": [
    [
      "bed68bfe97e83313"
    ],
    [
      "227e1ddaf3ee20a7"
    ],
    [
      "227e1ddaf3ee20a7"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;