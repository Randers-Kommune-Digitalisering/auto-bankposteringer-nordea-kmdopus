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
  "x": 1190,
  "y": 420,
  "wires": [
    [
      "d1696af71d54aa34"
    ]
  ],
  "_order": 19
}

module.exports = Node;