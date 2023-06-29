const Node = {
  "id": "0b86135e788bd7d8",
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
  "x": 800,
  "y": 1720,
  "wires": [
    [
      "bf74fede240a4d1c"
    ]
  ],
  "_order": 162
}

module.exports = Node;