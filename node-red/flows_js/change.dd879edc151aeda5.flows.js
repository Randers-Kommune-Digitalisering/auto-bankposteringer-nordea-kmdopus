const Node = {
  "id": "dd879edc151aeda5",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "83692983b416dfd5",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "req.params.uid ~> $number()",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "simpleDate",
      "pt": "global",
      "to": "$now()",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 635,
  "y": 600,
  "wires": [
    [
      "e9965ee9f390789f",
      "2b2009c141cdc7df"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;