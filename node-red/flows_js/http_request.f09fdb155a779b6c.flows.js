const Node = {
  "id": "f09fdb155a779b6c",
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
  "y": 1300,
  "wires": [
    [
      "c52e50aa031a16e6"
    ]
  ],
  "_order": 122
}

module.exports = Node;