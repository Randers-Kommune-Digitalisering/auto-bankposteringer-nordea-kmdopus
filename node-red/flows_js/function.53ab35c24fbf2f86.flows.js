const Node = {
  "id": "53ab35c24fbf2f86",
  "type": "function",
  "z": "VueExample",
  "name": "Transform accounts for display",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 455,
  "y": 1220,
  "wires": [
    [
      "ea2578e33872e34c"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const bankAccountNames = global.get("bankAccountNames") ?? [];
  const bankAccounts = global.get("bankAccounts") ?? [];
  const intermediateAccounts = global.get("intermediateAccounts") ?? [];
  const statusAccounts = global.get("statusAccounts") ?? [];
  
  const length = Math.min(bankAccountNames.length, bankAccounts.length, intermediateAccounts.length, statusAccounts.length);
  
  const completeBankInformation = [];
  
  for (let i = 0; i < length; i++) {
      const obj = {
          Navn: bankAccountNames[i],
          IBAN: bankAccounts[i],
          Statuskonto: statusAccounts[i],
          Mellemregningskonto: intermediateAccounts[i]
      };
      completeBankInformation.push(obj);
  }
  
  msg.payload = completeBankInformation;
  
  return msg;
}

module.exports = Node;