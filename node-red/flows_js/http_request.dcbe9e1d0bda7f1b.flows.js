const Node = {
  "id": "dcbe9e1d0bda7f1b",
  "type": "http request",
  "z": "6cc161e748b99815",
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
  "x": 1110,
  "y": 120,
  "wires": [
    [
      "df97189634c67140",
      "8aa5bc8b7a41022d"
    ]
  ],
  "_order": 14
}

module.exports = Node;