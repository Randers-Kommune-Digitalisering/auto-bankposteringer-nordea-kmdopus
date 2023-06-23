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
  "x": 1290,
  "y": 100,
  "wires": [
    [
      "65a1f4032c3f6a3d",
      "828f8a3ef9544e61"
    ]
  ],
  "_order": 33
}

module.exports = Node;