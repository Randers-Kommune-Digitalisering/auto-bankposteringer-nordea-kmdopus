const Node = {
  "id": "761ab2dcc30bf5c1",
  "type": "change",
  "z": "9f235917ac3d8025",
  "name": "Set PEM as response",
  "rules": [
    {
      "t": "set",
      "p": "payload.response",
      "pt": "msg",
      "to": "publicPem",
      "tot": "flow",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 740,
  "y": 380,
  "wires": [
    [
      "dde0409b06a75d4e"
    ]
  ],
  "_order": 90
}

module.exports = Node;