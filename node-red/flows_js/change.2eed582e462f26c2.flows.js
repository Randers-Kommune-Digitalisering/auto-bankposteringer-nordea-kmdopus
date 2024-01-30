const Node = {
  "id": "2eed582e462f26c2",
  "type": "change",
  "z": "f91accb007eed9a2",
  "d": true,
  "g": "e91cfd9c3d7a28e4",
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
  "y": 360,
  "wires": [
    [
      "a4bc9a85e2baab9b"
    ]
  ],
  "_order": 260
}

module.exports = Node;