const Node = {
  "id": "a7b6c3faac860d67",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "9707809d7fe4863a",
  "name": "Check status code from API response",
  "property": "statusCode",
  "propertyType": "msg",
  "rules": [
    {
      "t": "eq",
      "v": "409",
      "vt": "num"
    },
    {
      "t": "btwn",
      "v": "400",
      "vt": "num",
      "v2": "499",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "500",
      "vt": "num",
      "v2": "599",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "200",
      "vt": "num",
      "v2": "299",
      "v2t": "num"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 4,
  "x": 115,
  "y": 300,
  "wires": [
    [
      "2e449f988c67a99d"
    ],
    [
      "5b0e22c04ca85106"
    ],
    [
      "5b0e22c04ca85106"
    ],
    [
      "d4b848bdae2bb91b"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;