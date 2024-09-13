const Node = {
  "id": "670f9430c590cdc5",
  "type": "change",
  "z": "431f85f122b4636d",
  "name": "Set initial bankAccounts",
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
  "x": 390,
  "y": 240,
  "wires": [
    [
      "a31ad194ed05bfc3"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;