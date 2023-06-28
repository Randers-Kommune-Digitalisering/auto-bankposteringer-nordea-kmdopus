const Node = {
  "id": "c9eed6e9ecb725ff",
  "type": "http request",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
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
  "x": 1470,
  "y": 120,
  "wires": [
    [
      "7f98915332eaa637"
    ]
  ],
  "_order": 17
}

module.exports = Node;