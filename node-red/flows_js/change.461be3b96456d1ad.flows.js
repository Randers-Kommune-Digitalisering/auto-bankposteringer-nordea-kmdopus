const Node = {
  "id": "461be3b96456d1ad",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "977504c173614784",
  "name": "Angiv stamdata (evt. med tomme værdier)",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.admSysData.admEmail",
      "pt": "global",
      "to": "csl@randers.dk",
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
      "to": "Christian Leonhardt",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.integrationBool",
      "pt": "global",
      "to": "false",
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
      "94afef3b761a4ee0"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;