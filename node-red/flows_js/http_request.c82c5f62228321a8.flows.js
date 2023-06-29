const Node = {
  "id": "c82c5f62228321a8",
  "type": "http request",
  "z": "e37c26303529a6e8",
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
      "fe7a6ee5501f3737"
    ]
  ],
  "_order": 112
}

module.exports = Node;