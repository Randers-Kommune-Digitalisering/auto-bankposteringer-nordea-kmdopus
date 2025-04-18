const Node = {
  "id": "68178c0808fb5be0",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "865ca641c6246507",
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
      "to": "[[\"narrative\",\"message\"],\"counterparty_name\",\"type_description\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 210,
  "y": 180,
  "wires": [
    [
      "bdd39988053577ff"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;