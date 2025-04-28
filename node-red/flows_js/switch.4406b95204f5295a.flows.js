const Node = {
  "id": "4406b95204f5295a",
  "type": "switch",
  "z": "88c6307a5ee1dd81",
  "g": "474faa1bf813b5a8",
  "name": "",
  "property": "payload",
  "propertyType": "msg",
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
  "x": 155,
  "y": 360,
  "wires": [
    [
      "bccf2aa530888657"
    ],
    [
      "1772f6ae9875fbb6"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;