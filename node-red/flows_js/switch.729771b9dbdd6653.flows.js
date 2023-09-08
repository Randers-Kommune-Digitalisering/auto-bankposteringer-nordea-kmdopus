const Node = {
  "id": "729771b9dbdd6653",
  "type": "switch",
  "z": "6cc161e748b99815",
  "g": "ba3672736693a848",
  "name": "",
  "property": "request_status",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "ACTIVE",
      "vt": "str"
    },
    {
      "t": "neq",
      "v": "ACTIVE",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 780,
  "y": 900,
  "wires": [
    [
      "b3c3958d809f0978"
    ],
    [
      "5cadc277567ca69b"
    ]
  ],
  "_order": 103
}

module.exports = Node;