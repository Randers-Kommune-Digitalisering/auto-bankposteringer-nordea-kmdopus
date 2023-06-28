const Node = {
  "id": "8dfa05847c0adf64",
  "type": "http request",
  "z": "257592181f6612d1",
  "name": "hent accounts",
  "method": "GET",
  "ret": "obj",
  "paytoqs": "ignore",
  "url": "https://api.nordeaopenbanking.com/corporate/premium/v3/accounts/DK5036579260-USD/transactions",
  "tls": "",
  "persist": false,
  "proxy": "",
  "insecureHTTPParser": true,
  "authType": "",
  "senderr": false,
  "headers": [],
  "x": 820,
  "y": 860,
  "wires": [
    [
      "f37da890b6d54214"
    ]
  ],
  "_order": 118
}

module.exports = Node;