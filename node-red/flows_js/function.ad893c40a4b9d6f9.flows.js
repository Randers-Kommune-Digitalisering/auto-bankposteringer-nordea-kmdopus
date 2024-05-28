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
  "x": 300,
  "y": 60,
  "wires": [
    [
      "66b81c6ebf307b20"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
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
          Object.entries(data).map(([key, value]) => [key, value ? String(value).replace(/#/g, '') : value])
      );
  
      const {
          Reference,
          Advisliste,
          Afsender,
          Posteringstype,
          end_to_end_reference,
          match_regel,
          Beløb1,
          Beløb2,
          beløb_regel,
          Posteringstekst,
          Artskonto,
          PSP,
          Notat
      } = cleanedData;
  
      console.log(cleanedData);
  
      const hasHash = Object.values(data).some(value => value && String(value).includes("#"));
      const isActive = !hasHash;
      const activeObject = { active: isActive };
  
      const valueOperatorValue = operatorMapping[beløb_regel] || null;
  
      // Create "exception" attribute and remove Artskonto if true
      const shouldBeException = Artskonto === "90540000";
      cleanedData.Artskonto = shouldBeException ? undefined : Artskonto;
      const exceptionObject = { exception: shouldBeException };
  
      return [
          { name: "Reference", value: Reference},
          { name: "Advisliste", value: Advisliste},
          { name: "Afsender", value: Afsender},
          { name: "Posteringstype", value: Posteringstype},
          { name: "End-to-end-reference", value: end_to_end_reference},
          { name: "Beløb", value1: Beløb1, value2: Beløb2, operator: valueOperatorValue },
          { Posteringstekst, Artskonto, PSP, Notat },
          activeObject,
          { ruleId: index },
          exceptionObject
      ];
  });
  
  const rules = jsonData != null ? jsonData.map((rule, index) => ({ ...rule, 8: { ruleId: index } })) : [];
  
  msg.payload = rules;
  global.set("konteringsregler", rules);
  
  return msg;
  
}

module.exports = Node;