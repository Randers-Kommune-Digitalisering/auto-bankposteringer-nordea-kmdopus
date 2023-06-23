const Node = {
  "id": "0bb4ee78bd91757a",
  "type": "http request",
  "z": "c61e25446fe03797",
  "name": "hent accounts",
  "method": "GET",
  "ret": "obj",
  "paytoqs": "ignore",
  "url": "https://api.nordeaopenbanking.com/corporate/premium/v3/accounts",
  "tls": "e5347e83dbf94857",
  "persist": false,
  "proxy": "",
  "insecureHTTPParser": true,
  "authType": "",
  "senderr": false,
  "headers": [],
  "x": 700,
  "y": 60,
  "wires": [
    [
      "9e0fc868fe7a2dde"
    ]
  ],
  "_order": 47
}

module.exports = Node;