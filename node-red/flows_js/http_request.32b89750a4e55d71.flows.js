const Node = {
  "id": "32b89750a4e55d71",
  "type": "http request",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
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
  "x": 1410,
  "y": 240,
  "wires": [
    [
      "3b08e27678ba2372"
    ]
  ],
  "_order": 65
}

module.exports = Node;