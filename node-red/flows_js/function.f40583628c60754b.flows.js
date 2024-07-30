const Node = {
  "id": "f40583628c60754b",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "ada765780fa31438",
  "name": "Transform accounts for display",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 465,
  "y": 380,
  "wires": [
    [
      "6feca11a8cb0764e"
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