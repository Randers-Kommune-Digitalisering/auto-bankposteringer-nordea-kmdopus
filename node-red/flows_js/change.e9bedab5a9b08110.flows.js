const Node = {
  "id": "e9bedab5a9b08110",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Angiv bankkonti (evt. med tomme værdier)",
  "rules": [
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].bankAccount",
      "pt": "global",
      "to": "DK20005908764988-DKK",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].bankAccountName",
      "pt": "global",
      "to": "Hovedkonto",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].statusAccount",
      "pt": "global",
      "to": "90540000",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[0].intermediateAccount",
      "pt": "global",
      "to": "95990009",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].bankAccount",
      "pt": "global",
      "to": "DK20009035615315-DKK",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].bankAccountName",
      "pt": "global",
      "to": "Debitorkonto",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].statusAccount",
      "pt": "global",
      "to": "90541000",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "configs.initialData.bankAccounts[1].intermediateAccount",
      "pt": "global",
      "to": "95991009",
      "tot": "num"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 230,
  "y": 360,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;