const Node = {
  "id": "884b223c101e2573",
  "type": "function",
  "z": "b4ac8ea3a77a9132",
  "g": "25ef659717eb2e31",
  "name": "Omstrukturering",
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
  "x": 320,
  "y": 120,
  "wires": [
    [
      "329ceb4beeb16d5c"
    ]
  ],
  "_order": 147
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv) {
  let omp_headers = ["Artskonto", "Omkostningssted", "PSP-element", "Profitcenter", "Ordre", "Debet/kredit", "Beløb", "Næste agent", "Tekst", "Betalingsart", "Påligningsår", "Betalingsmodtagernr.", "Betalingsmodtagernr.kode", "Ydelsesmodtagernr.", "Ydelsesmodtagernr.kode", "Ydelsesperiode fra", "Ydelsesperiode til", "Oplysningspligtnr.", "Oplysningspligtmodtagernr.kode", "Oplysningspligtkode", "Netværk", "Operation", "Mængde", "Mængdeenhed", "Referencenøgle"];
  global.set("omp_headers", omp_headers.join(', '));
  
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
  
  const jsonData = csvData.map((data, index) => {
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
          { ruleId: index }
      ];
  });
  
  msg.payload = jsonData;
  return msg;
  
}

module.exports = Node;