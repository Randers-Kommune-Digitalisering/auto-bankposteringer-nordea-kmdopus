const Node = {
  "id": "37b8f6f97f30d160",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Angiv stamdata (evt. med tomme værdier)",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.masterData.admEmail",
      "pt": "global",
      "to": "jan.molbaek@randers.dk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData.admID",
      "pt": "global",
      "to": "AUTH_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData.admName",
      "pt": "global",
      "to": "Jan Mølbæk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData.integrationBool",
      "pt": "global",
      "to": "false",
      "tot": "bool"
    },
    {
      "t": "set",
      "p": "configs.initialData.masterData.erpSystem",
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
  "y": 240,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;