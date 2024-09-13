const Node = {
  "id": "3dbd9a44a2e8e2ea",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "46c70bcd77ca965a",
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
  "x": 465,
  "y": 580,
  "wires": [
    [
      "18b22abc816761e0"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  const bankAccounts = global.get("bankAccounts") ?? [];
  const statusAccounts = bankAccounts.map(account => account.statusAccount);
  const operatorMapping = {
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
      const ActiveBool = isActive;
  
      const amount1 = Beløb1 != null ? parseFloat(Beløb1.replace(',', '.')) : null;
      const amount2 = Beløb2 != null ? parseFloat(Beløb2.replace(',', '.')) : null;
  
      const valueOperatorValue = operatorMapping[beløb_regel] || null;
      const Operator = valueOperatorValue;
  
      const RuleID = index;
  
      // Create "exception" attribute and remove Artskonto if true
      const shouldBeException = statusAccounts.includes(parseInt(Artskonto));
      cleanedData.Artskonto = shouldBeException ? null : Artskonto;
      const ExceptionBool = shouldBeException;
  
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
          ActiveBool,
          ExceptionBool,
          RuleID
      };
  });
  
  // const rules = jsonData != null ? jsonData.map((rule, index) => ({ ...rule, 5: { ruleId: index } })) : [];
  
  msg.payload = jsonData;
  
  return msg;
}

module.exports = Node;