const Node = {
  "id": "8304673543e94023",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "977504c173614784",
  "name": "Angiv Open Banking data",
  "rules": [
    {
      "t": "set",
      "p": "configs.banking.provider",
      "pt": "global",
      "to": "Nordea",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.banking.domain",
      "pt": "global",
      "to": "https://open.nordea.com",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.banking.domainShort",
      "pt": "global",
      "to": "open.nordea.com",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.banking.id",
      "pt": "global",
      "to": "CLIENT_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.banking.secret",
      "pt": "global",
      "to": "CLIENT_SECRET",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.banking.eidas.privateKey",
      "pt": "global",
      "to": "EIDASPRIVATEKEY",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.banking.agreement",
      "pt": "global",
      "to": "AGREEMENT_ID",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "configs.banking.usefulParameters",
      "pt": "global",
      "to": "[[\"narrative\",\"message\"],[\"counterparty_name\",\"counterparty_address\"],\"type_description\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 230,
  "y": 180,
  "wires": [
    [
      "2ced4f63eacfb862"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;