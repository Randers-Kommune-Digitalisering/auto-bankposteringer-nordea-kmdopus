const Node = {
  "id": "4c84a9964f972f17",
  "type": "change",
  "z": "32cf2bec698ca424",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"transactionsWithNoMatch\")[transaction_id = $$.uid]",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 705,
  "y": 540,
  "wires": [
    [
      "2b021fe83cd382e2"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;