const Node = {
  "id": "88c4e13ff233f7b6",
  "type": "change",
  "z": "431f85f122b4636d",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "client_id",
      "pt": "msg",
      "to": "CLIENT_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "client_secret",
      "pt": "msg",
      "to": "CLIENT_SECRET",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "eidas",
      "pt": "msg",
      "to": "EIDASPRIVATEKEY",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "hovedkonto",
      "pt": "msg",
      "to": "HOVEDKONTO",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "debitorkonto",
      "pt": "msg",
      "to": "DEBITORKONTO",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "auth_id",
      "pt": "msg",
      "to": "AUTH_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "agreement_id",
      "pt": "msg",
      "to": "AGREEMENT_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "cred_secret",
      "pt": "msg",
      "to": "CREDENTIAL_SECRET",
      "tot": "env"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1000,
  "y": 400,
  "wires": [
    [
      "ffd6714d381638c5"
    ]
  ]
}

module.exports = Node;