const Node = {
  "id": "55dbc08a7b8fc478",
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
  "y": 360,
  "wires": [
    [
      "426a1d91a4a83557"
    ]
  ],
  "_order": 105
}

module.exports = Node;