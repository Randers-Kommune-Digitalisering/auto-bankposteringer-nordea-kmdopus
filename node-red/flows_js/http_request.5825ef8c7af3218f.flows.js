const Node = {
  "id": "5825ef8c7af3218f",
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
  "y": 360,
  "wires": [
    [
      "8d1da949e3e12ca4"
    ]
  ],
  "_order": 128
}

module.exports = Node;