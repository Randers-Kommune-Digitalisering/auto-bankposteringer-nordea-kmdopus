const Node = {
  "id": "dcbe9e1d0bda7f1b",
  "type": "http request",
  "z": "6cc161e748b99815",
  "g": "3bdd50ac31e6a0b9",
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
  "x": 830,
  "y": 60,
  "wires": [
    [
      "ebe79f7426284b57"
    ]
  ],
  "_order": 36
}

module.exports = Node;