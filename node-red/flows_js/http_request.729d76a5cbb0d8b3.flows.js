const Node = {
  "id": "729d76a5cbb0d8b3",
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
  "x": 800,
  "y": 1720,
  "wires": [
    [
      "4a9b649c6c8ce016"
    ]
  ],
  "_order": 190
}

module.exports = Node;