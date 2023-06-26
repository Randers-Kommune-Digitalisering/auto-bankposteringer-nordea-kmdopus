const Node = {
  "id": "861c7e77bcb91e9a",
  "type": "change",
  "z": "b2c910a3562c542e",
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
      "p": "req",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "req.method",
      "pt": "msg",
      "to": "GET",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "req.url_path",
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
  "y": 80,
  "wires": [
    [
      "ed08e76cd0ce1272"
    ]
  ],
  "_order": 42
}

module.exports = Node;