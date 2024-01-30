const Node = {
  "id": "e4d850011ccad60f",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "Env vars & clean flow context",
  "rules": [
    {
      "t": "set",
      "p": "eidasPrivateKey",
      "pt": "flow",
      "to": "EIDASPRIVATEKEY",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "X-IBM-Client-Id",
      "pt": "flow",
      "to": "CLIENT_ID",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "X-IBM-Client-Secret",
      "pt": "flow",
      "to": "CLIENT_SECRET",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "agreement_id",
      "pt": "flow",
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
  "x": 400,
  "y": 60,
  "wires": [
    [
      "7a9c780ed742f3c1"
    ]
  ],
  "_order": 167
}

module.exports = Node;