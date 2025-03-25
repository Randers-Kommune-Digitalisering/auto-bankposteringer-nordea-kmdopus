const Node = {
  "id": "37b8f6f97f30d160",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "865ca641c6246507",
  "name": "Angiv stamdata (evt. med tomme værdier)",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.admSysData.admEmail",
      "pt": "global",
      "to": "jan.molbaek@randers.dk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.admID",
      "pt": "global",
      "to": "AUTH_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.admName",
      "pt": "global",
      "to": "Jan Mølbæk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.integrationBool",
      "pt": "global",
      "to": "true",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.erpSystem",
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
  "x": 260,
  "y": 100,
  "wires": [
    [
      "422cec83cfba270e"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;