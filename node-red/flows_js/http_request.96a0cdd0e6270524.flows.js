const Node = {
  "id": "96a0cdd0e6270524",
  "type": "http request",
  "z": "6cc161e748b99815",
  "g": "3bdd50ac31e6a0b9",
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
  "x": 830,
  "y": 180,
  "wires": [
    [
      "74bca3efce84e142"
    ]
  ],
  "_order": 57
}

module.exports = Node;