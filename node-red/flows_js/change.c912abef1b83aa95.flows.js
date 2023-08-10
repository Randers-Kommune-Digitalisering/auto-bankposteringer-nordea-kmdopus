const Node = {
  "id": "c912abef1b83aa95",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "Test env.",
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
  "x": 600,
  "y": 120,
  "wires": [
    [
      "28e89cae0a98b2c0",
      "d57cbca3b91dfc4b"
    ]
  ],
  "_order": 13
}

module.exports = Node;