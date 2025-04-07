const Node = {
  "id": "dd879edc151aeda5",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "83692983b416dfd5",
  "name": "Set vars",
  "rules": [
    {
      "t": "set",
      "p": "uid",
      "pt": "msg",
      "to": "req.params.uid ~> $string()",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions.manual",
      "pt": "global",
      "to": "[payload]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "dates.bookingDate",
      "pt": "global",
      "to": "payload.bookingDate",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "transactions.uid",
      "pt": "global",
      "to": "uid",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 740,
  "wires": [
    [
      "bac1384d9ea7c900",
      "3d18e2ece41ab7a9"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;