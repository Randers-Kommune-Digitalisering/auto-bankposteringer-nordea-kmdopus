const Node = {
  "id": "2fd04909cd397026",
  "type": "http request",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
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
  "x": 1410,
  "y": 120,
  "wires": [
    [
      "4fcd04c4a23ce5f3"
    ]
  ],
  "_order": 15
}

module.exports = Node;