const Node = {
  "id": "b96da9492994439b",
  "type": "function",
  "z": "a1938e80ddbe5950",
  "g": "d8d1d8e39f1b0cb7",
  "name": "Parse",
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
  "x": 610,
  "y": 460,
  "wires": [
    [
      "e9fcb6b8c3d17d60"
    ]
  ],
  "_order": 72
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  const csvData = msg.payload; // Assuming msg.payload contains an array of parsed CSV objects
  
  const operatorMapping = {
      "Indeholder": "contains",
      "Starter med": ".startsWith",
      "Slutter med": ".endsWith",
      "Større end": ">",
      "Mindre end": "<",
      "Mellem": "><",
      "Lig med": "==",
  };
  
  const jsonData = csvData.map(data => {
      // Remove "#" character from all values
      const cleanedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value ? String(value).replace(/#/g, '') : value])
      );
  
      const {
          Reference,
          Advisliste,
          Afsender,
          Posteringstype,
          match_regel,
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
      const activeObject = { active: isActive };
  
      const operatorValue = operatorMapping[match_regel] || null;
      const valueOperatorValue = operatorMapping[beløb_regel] || null;
  
      return [
          { name: "Reference", value: Reference, operator: Reference ? operatorValue : null },
          { name: "Advisliste", value: Advisliste, operator: Advisliste ? operatorValue : null },
          { name: "Afsender", value: Afsender, operator: Afsender ? operatorValue : null },
          { name: "Posteringstype", value: Posteringstype, operator: Posteringstype ? operatorValue : null },
          { name: "Beløb", value1: Beløb1, value2: Beløb2, operator: valueOperatorValue },
          { Posteringstekst, Artskonto, PSP, Notat },
          activeObject,
      ];
  });
  
  msg.payload = jsonData;
  return msg;
  
}

module.exports = Node;