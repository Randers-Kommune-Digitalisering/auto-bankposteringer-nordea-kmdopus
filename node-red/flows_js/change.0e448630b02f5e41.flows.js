const Node = {
  "id": "0e448630b02f5e41",
  "type": "change",
  "z": "431f85f122b4636d",
  "name": "Set initial masterData",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.masterData[0].admEmail",
      "pt": "global",
      "to": "jan.molbaek@randers.dk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData[0].admID",
      "pt": "global",
      "to": "AUTH_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData[0].admName",
      "pt": "global",
      "to": "Jan Mølbæk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData[0].integrationBool",
      "pt": "global",
      "to": "false",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData[0].erpSystem",
      "pt": "global",
      "to": "KMD Opus",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 380,
  "y": 200,
  "wires": [
    [
      "a31ad194ed05bfc3"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;