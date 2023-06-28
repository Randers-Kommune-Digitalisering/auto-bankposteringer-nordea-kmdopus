const Node = {
  "id": "484afaf7cd918258",
  "type": "change",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Set environment variables",
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
  "x": 330,
  "y": 420,
  "wires": [
    [
      "dda6e256ceaacd5d"
    ]
  ],
  "_order": 18
}

module.exports = Node;