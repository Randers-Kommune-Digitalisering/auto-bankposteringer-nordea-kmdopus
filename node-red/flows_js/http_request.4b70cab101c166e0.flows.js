const Node = {
  "id": "4b70cab101c166e0",
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
  "y": 1300,
  "wires": [
    [
      "4ea9d4acce856534"
    ]
  ],
  "_order": 146
}

module.exports = Node;