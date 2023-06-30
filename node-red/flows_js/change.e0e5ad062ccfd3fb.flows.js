const Node = {
  "id": "e0e5ad062ccfd3fb",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
  "name": "Set env. var.",
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
  "x": 690,
  "y": 120,
  "wires": [
    [
      "14dfb23d0e280c8c"
    ]
  ],
  "_order": 29
}

module.exports = Node;