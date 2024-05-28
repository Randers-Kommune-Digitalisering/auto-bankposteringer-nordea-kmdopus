const Node = {
  "id": "86ccfe98bbfc82c1",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "All pages requested?",
  "property": "link_to_next_page",
  "propertyType": "flow",
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
  "x": 1025,
  "y": 280,
  "wires": [
    [
      "3bf0fcec8ac96b0c",
      "4e384ce7a5fd0cec"
    ],
    [
      "7c0de16e13c5e6e5"
    ]
  ],
  "l": false
}

module.exports = Node;