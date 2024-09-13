const Node = {
  "id": "364833504bf77607",
  "type": "change",
  "z": "2d5de3ec9a4f11b6",
  "d": true,
  "g": "e994bb10f3cf8fa8",
  "name": "Redis bypass",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "[{\"amount\":\"1494.00\",\"artskonto\":\"79000000\",\"message\":\"Viborg Kommune\",\"narrative\":\"Cap Viborg Meddelnr. 07004198123249\",\"psp\":\"xg-0000003071-00001\",\"transaction_id\":\"P5908764988202309070000846208\",\"type_description\":\"CAP\"},{\"amount\":\"27890.00\",\"artskonto\":\"95990009\",\"message\":\"SYGEDAGP.tlf89405555\",\"narrative\":\"Cap SYGEDAGP. Meddelnr. 07004263823249\",\"transaction_id\":\"P5908764988202309070000846207\",\"type_description\":\"CAP\"},{\"amount\":\"-23360.00\",\"artskonto\":\"40000000\",\"counterparty_account\":\"0004640586\",\"narrative\":\"Cap Sygedagpenge\",\"psp\":\"xg-0000000006-00007\",\"transaction_id\":\"P5908764988202309070000846206\",\"type_description\":\"CAP\"}]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 140,
  "y": 280,
  "wires": [
    [
      "41c3f4da22d53f70"
    ]
  ]
}

module.exports = Node;