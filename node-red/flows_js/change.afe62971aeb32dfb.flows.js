const Node = {
  "id": "afe62971aeb32dfb",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "1c77fa2eb47442fd",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "hovedkonto_transactions",
      "pt": "global",
      "to": "payload.response.transactions",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "list_http_code",
      "pt": "global",
      "to": "payload.group_header.http_code",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1710,
  "y": 280,
  "wires": [
    [
      "41b71a21957d00b8"
    ]
  ],
  "_order": 163
}

module.exports = Node;