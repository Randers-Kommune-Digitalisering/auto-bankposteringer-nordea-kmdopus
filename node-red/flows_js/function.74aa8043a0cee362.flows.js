const Node = {
  "id": "74aa8043a0cee362",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "68f21991ad3e5be0",
  "name": "restructure data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1145,
  "y": 80,
  "wires": [
    [
      "cd450d4a1e35940d"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let configsObj = global.get("configs");
  const bankAccounts = global.get("masterData").bankAccounts;
  const statusAccounts = bankAccounts.map(account => account.statusAccount);
  const operatorMapping = {
      "Større end": ">",
      "Mindre end": "<",
      "Mellem": "><",
      "Lig med": "==",
  };
  
  function combineStrings(string1, string2) {
      if (!string1) return string2 || null;
      if (!string2) return string1 || null;
      return `${string1}, ${string2}`;
  }
  
  const jsonData = msg.payload.map((data, index) => {  
      // Remove "#" character from all values
      const cleanedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value ? String(value).replace(/#/g, '') : undefined])
      );
  
      const {
          Reference,
          Afsender,
          Posteringstype,
          Beløb1,
          Beløb2,
          beløb_regel,
          Posteringstekst,
          Artskonto,
          PSP,
          Notat,
          Bankkonto
      } = cleanedData;
  
      const hasHash = Object.values(data).some(value => value && String(value).includes("#"));
      const isActive = !hasHash;
      const activeBool = isActive;
  
      let amount1 = null;
      let amount2 = null;
  
      switch (Beløb1) {
          case undefined:
              break;
          default:
              amount1 = parseFloat(Beløb1.replace(',', '.'));
              amount1 = amount1.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              break;
      }
  
      switch (Beløb2) {
          case undefined:
              break;
          default:
              amount2 = parseFloat(Beløb2.replace(',', '.'));
              amount2 = amount2.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              break;
      }
  
      const valueOperatorValue = operatorMapping[beløb_regel] || null;
      const operator = valueOperatorValue;
  
      const ruleID = index;
      
      const shouldBeException = statusAccounts.includes(Artskonto);
      cleanedData.Artskonto = shouldBeException ? null : Artskonto;
      const exceptionBool = shouldBeException;
      const lastUsed = "31-12-9999";
      const tempBool = false;
  
      return {
          reference: Reference || null,
          sender: Afsender || null,
          typeDescription: Posteringstype || null,
          amount1,
          amount2,
          operator,
          text: Posteringstekst || null,
          account: Artskonto || null,
          accountSecondary: PSP || null,
          note: Notat || null,
          activeBool,
          exceptionBool,
          tempBool,
          lastUsed,
          ruleID,
          relatedBankAccount: Bankkonto || null
      };
  });
  
  configsObj.initialData.rules = jsonData;
  global.set("configs", configsObj);
  
  return msg;
}

module.exports = Node;