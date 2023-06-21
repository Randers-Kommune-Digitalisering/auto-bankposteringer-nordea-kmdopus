const Node = {
  "id": "718e1576ed7ad36b",
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
  "x": 660,
  "y": 320,
  "wires": [
    [
      "da28141dd973c281"
    ]
  ],
  "_order": 15
}

module.exports = Node;