const Node = {
  "id": "37b8f6f97f30d160",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Angiv stamdata (evt. med tomme værdier)",
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
  "x": 220,
  "y": 280,
  "wires": [
    [
      "4bf5d6a9b5b9a77b"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;