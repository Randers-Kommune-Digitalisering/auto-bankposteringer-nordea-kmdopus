const Node = {
  "id": "b0c337d9102ec01f",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "13c42cab3fa29e38",
  "name": "restructure data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 465,
  "y": 260,
  "wires": [
    [
      "5c69fd337aa1c59c"
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
      
      const shouldBeException = statusAccounts.includes(Artskonto);
      cleanedData.Artskonto = shouldBeException ? null : Artskonto;
      const exceptionBool = shouldBeException;
      const lastUsed = "9999-12-31";
      const tempBool = false;
      const accountTertiary = null;
      const postWithCPR = false;
      const cpr = null;
  
      let relatedBankAccountName = null;
      if (Bankkonto) {
          const match = bankAccounts.find(acc => acc.bankAccount === Bankkonto);
          if (match) {
              relatedBankAccountName = match.bankAccountName || "Alle";
          }
      }
  
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
          accountTertiary,
          note: Notat || null,
          activeBool,
          exceptionBool,
          tempBool,
          lastUsed,
          relatedBankAccount: Bankkonto || null,
          relatedBankAccountName,
          postWithCPR,
          cpr
      };
  });
  
  configsObj.initialData.rules = jsonData;
  global.set("configs", configsObj);
  
  return msg;
}

module.exports = Node;