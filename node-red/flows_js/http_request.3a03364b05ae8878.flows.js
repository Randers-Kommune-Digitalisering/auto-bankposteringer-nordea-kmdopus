const Node = {
  "id": "3a03364b05ae8878",
  "type": "http request",
  "z": "b2c910a3562c542e",
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
  "x": 540,
  "y": 520,
  "wires": [
    [
      "85c9beb86059aeef"
    ]
  ],
  "_order": 83
}

module.exports = Node;