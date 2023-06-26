const Node = {
  "id": "6b1d7553508977f1",
  "type": "http request",
  "z": "8983772ca1c7d013",
  "name": "Initiate Auth",
  "method": "POST",
  "ret": "obj",
  "paytoqs": "ignore",
  "url": "https://api.nordeaopenbanking.com/corporate/v2/authorize",
  "tls": "",
  "persist": false,
  "proxy": "",
  "insecureHTTPParser": false,
  "authType": "",
  "senderr": false,
  "headers": [],
  "x": 1250,
  "y": 140,
  "wires": [
    [
      "65a1f4032c3f6a3d"
    ]
  ],
  "_order": 18
}

module.exports = Node;