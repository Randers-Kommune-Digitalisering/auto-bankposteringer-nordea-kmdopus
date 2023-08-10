const Node = {
  "id": "96a0cdd0e6270524",
  "type": "http request",
  "z": "6cc161e748b99815",
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
  "x": 1110,
  "y": 360,
  "wires": [
    [
      "9e4e9f35ebe0d23c",
      "d23c3bc6e563d861"
    ]
  ],
  "_order": 39
}

module.exports = Node;