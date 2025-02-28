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
      "to": "req.params.uid ~> $string()",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions.updatedFromTransaction",
      "pt": "global",
      "to": "$globalContext(\"transaction\").unmatched[transaction_id= $$.uid]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions.updatedToTransaction",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "dates.bookingDate",
      "pt": "global",
      "to": "$flowContext(\"updatedFromTransaction\").booking_date",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 655,
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