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
      "to": "AUTH_SENDER_ADDRESS",
      "tot": "env"
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
      "to": "AUTH_NAME",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.integrationBool",
      "pt": "global",
      "to": "$string($env(\"ERP_INTEGRATION_BOOL\")) = \"true\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "configs.initialData.admSysData.erpSystem",
      "pt": "global",
      "to": "ERP_NAME",
      "tot": "env"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 280,
  "y": 100,
  "wires": [
    [
      "94afef3b761a4ee0"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;