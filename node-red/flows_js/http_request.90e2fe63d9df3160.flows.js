const Node = {
  "id": "90e2fe63d9df3160",
  "type": "http request",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Exch. Token",
  "method": "POST",
  "ret": "obj",
  "paytoqs": "ignore",
  "url": "https://api.nordeaopenbanking.com/corporate/v2/authorize/token",
  "tls": "",
  "persist": false,
  "proxy": "",
  "insecureHTTPParser": false,
  "authType": "",
  "senderr": false,
  "headers": [],
  "x": 1470,
  "y": 240,
  "wires": [
    [
      "3f53c86f7c271419"
    ]
  ],
  "_order": 55
}

module.exports = Node;