const Node = {
  "id": "0df363702703d9c9",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "f51cc7b4f0bee577",
  "name": "Credentials",
  "rules": [
    {
      "t": "set",
      "p": "eidasPrivateKey",
      "pt": "global",
      "to": "EIDASPRIVATEKEY",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "X-IBM-Client-Id",
      "pt": "global",
      "to": "CLIENT_ID",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "X-IBM-Client-Secret",
      "pt": "global",
      "to": "CLIENT_SECRET",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "agreement_id",
      "pt": "global",
      "to": "AGREEMENT_ID",
      "tot": "env",
      "dc": true
    },
    {
      "t": "delete",
      "p": "query_param",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "query_param1",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "query_param2",
      "pt": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 470,
  "y": 300,
  "wires": [
    [
      "4c875b1eb2eb9d99"
    ]
  ],
  "_order": 114
}

module.exports = Node;