const Node = {
  "id": "042fc0ad5d5c9205",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "91ee0364118b77c6",
  "name": "set filename & payload",
  "rules": [
    {
      "t": "set",
      "p": "filename",
      "pt": "flow",
      "to": "\"/data/response_log/\"&$globalContext(\"dateOfOrigin\")&\".json\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "transactions",
      "tot": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1050,
  "y": 800,
  "wires": [
    [
      "71aad7fb08920426"
    ]
  ]
}

module.exports = Node;