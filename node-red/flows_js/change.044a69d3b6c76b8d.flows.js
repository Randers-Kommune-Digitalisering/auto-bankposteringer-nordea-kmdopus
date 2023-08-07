const Node = {
  "id": "044a69d3b6c76b8d",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "name": "Gem msg.rules til global obj + payload",
  "rules": [
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "rules",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "rules",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 630,
  "y": 280,
  "wires": [
    [
      "60ce3b97bd606829"
    ]
  ],
  "_order": 103
}

module.exports = Node;