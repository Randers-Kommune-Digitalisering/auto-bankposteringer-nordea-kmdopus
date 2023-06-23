const Node = {
  "id": "9cf3689d165feb0c",
  "type": "http request",
  "z": "8983772ca1c7d013",
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
  "x": 920,
  "y": 820,
  "wires": [
    [
      "1f6e1c0e843f0eb3"
    ]
  ],
  "_order": 21
}

module.exports = Node;