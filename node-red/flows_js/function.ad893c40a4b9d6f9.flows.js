const Node = {
  "id": "ad893c40a4b9d6f9",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "248b6faf1bd25dc8",
  "name": "restructure data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "csv",
      "module": "csv-parser"
    }
  ],
  "x": 385,
  "y": 60,
  "wires": [
    [
      "66b81c6ebf307b20"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  const statusAccounts = global.get("statusAccounts");
  const operatorMapping = {
      "Indeholder": "contains",
      "Starter med": ".startsWith",
      "Slutter med": ".endsWith",
      "Større end": ">",
      "Mindre end": "<",
      "Mellem": "><",
      "Lig med": "==",
  };
  
  const jsonData = msg.payload.map((data, index) => {  
      // Remove "#" character from all values
      const cleanedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value ? String(value).replace(/#/g, '') : undefined])
      );
  
      const {
          Reference,
          Advisliste,
          Afsender,
          Posteringstype,
          Beløb1,
          Beløb2,
          beløb_regel,
          Posteringstekst,
          Artskonto,
          PSP,
          Notat
      } = cleanedData;
  
      const hasHash = Object.values(data).some(value => value && String(value).includes("#"));
      const isActive = !hasHash;
      const Active = isActive;
  
      const amount1 = Beløb1 != null ? parseFloat(Beløb1.replace(',', '.')) : null;
      const amount2 = Beløb2 != null ? parseFloat(Beløb2.replace(',', '.')) : null;
  
      const valueOperatorValue = operatorMapping[beløb_regel] || null;
      const Operator = valueOperatorValue;
  
      const RuleID = index;
  
      // Create "exception" attribute and remove Artskonto if true
      const shouldBeException = statusAccounts.includes(Artskonto);
      cleanedData.Artskonto = shouldBeException ? null : Artskonto;
      const Exception = shouldBeException;
  
      return {
          Reference: Reference || null,
          Advisliste: Advisliste || null,
          Afsender: Afsender || null,
          Posteringstype: Posteringstype || null,
          Beløb1: amount1,
          Beløb2: amount2,
          Operator,
          Posteringstekst: Posteringstekst || null,
          Artskonto: Artskonto || null,
          PSP: PSP || null,
          Notat: Notat || null,
          Active,
          Exception,
          RuleID
      };
  });
  
  // const rules = jsonData != null ? jsonData.map((rule, index) => ({ ...rule, 5: { ruleId: index } })) : [];
  
  msg.payload = jsonData;
  global.set("accountingRules", jsonData);
  
  return msg;
}

module.exports = Node;