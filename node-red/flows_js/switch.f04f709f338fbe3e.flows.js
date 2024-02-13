const Node = {
  "id": "f04f709f338fbe3e",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "9d7a704133314cab",
  "name": "switch req status",
  "property": "request_status",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "PENDING",
      "vt": "str"
    },
    {
      "t": "neq",
      "v": "PENDING",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 1330,
  "y": 60,
  "wires": [
    [
      "302deede66edf3b7"
    ],
    [
      "d6bd73a14364aa0d"
    ]
  ],
  "_order": 157
}

module.exports = Node;