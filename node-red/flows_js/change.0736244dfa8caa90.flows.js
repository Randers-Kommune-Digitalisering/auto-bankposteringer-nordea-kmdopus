const Node = {
  "id": "0736244dfa8caa90",
  "type": "change",
  "z": "257592181f6612d1",
  "name": "Set headers",
  "rules": [
    {
      "t": "set",
      "p": "headers",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "headers.x-ibm-client-id",
      "pt": "msg",
      "to": "bff6e089c937b9d710e68c00d5114654",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.x-ibm-client-secret",
      "pt": "msg",
      "to": "d3cc01f5aa2be9d4946b9bc5834ea739",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.x-nordea-originating-host",
      "pt": "msg",
      "to": "api.nordeaopenbanking.com",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "payload.req",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "payload.req.method",
      "pt": "msg",
      "to": "GET",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "payload.req.url_path",
      "pt": "msg",
      "to": "https://api.nordeaopenbanking.com/corporate/premium/v3/accounts/DK5036579260-USD/transactions",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 270,
  "y": 1440,
  "wires": [
    [
      "13162af4aa70161c"
    ]
  ],
  "_order": 150
}

module.exports = Node;