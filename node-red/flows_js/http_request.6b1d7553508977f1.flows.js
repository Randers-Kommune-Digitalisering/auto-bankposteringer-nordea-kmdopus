const Node = {
  "id": "6b1d7553508977f1",
  "type": "http request",
  "z": "8983772ca1c7d013",
  "name": "Initiate Auth",
  "method": "use",
  "ret": "txt",
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
      "65a1f4032c3f6a3d"
    ]
  ],
  "_order": 33
}

module.exports = Node;