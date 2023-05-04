const Node = {
  "id": "3e3a2119b6ce7876",
  "type": "change",
  "z": "0bc16db685bd2e6a",
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
      "44fade9967adb646"
    ]
  ],
  "_order": 80
}

module.exports = Node;