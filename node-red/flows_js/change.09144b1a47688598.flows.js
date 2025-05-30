const Node = {
  "id": "09144b1a47688598",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "977504c173614784",
  "name": "Angiv bankkonti (evt. med tomme værdier)",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].bankAccount",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].bankAccountName",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].statusAccount",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].intermediateAccount",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].bankAccount",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].bankAccountName",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].statusAccount",
      "pt": "global",
      "to": "",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].intermediateAccount",
      "pt": "global",
      "to": "",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 290,
  "y": 140,
  "wires": [
    [
      "c2c41f96d66d4c63"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;