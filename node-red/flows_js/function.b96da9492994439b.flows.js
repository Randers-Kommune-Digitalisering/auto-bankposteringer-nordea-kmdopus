const Node = {
  "id": "b96da9492994439b",
  "type": "function",
  "z": "a1938e80ddbe5950",
  "g": "2be607f061d91628",
  "name": "function 1",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 900,
  "y": 480,
  "wires": [
    [
      "e9fcb6b8c3d17d60"
    ]
  ],
  "_order": 73
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const csvData = msg.payload;
  const lines = csvData.split("\n"); // Split the CSV data into lines
  
  // Mapping object for operator replacements
  const operatorMapping = {
      "Indeholder": "contains",
      "Starter med": ".startsWith",
      "Slutter med": ".endsWith",
      "Større end": ">",
      "Mindre end": "<",
      "Mellem": "><",
      "Lig med": "==",
  };
  
  const jsonData = lines.map((line) => {
      const columns = line.split(";"); // Split each line into columns
      // Extract values from columns
      const name1 = columns[0];
      const name2 = columns[1];
      const name3 = columns[2];
      const name4 = columns[3];
      const operator = operatorMapping[columns[4]] || null;
      const value1 = columns[5];
      const value2 = columns[6];
      const valueOperator = operatorMapping[columns[7]] || null;
      const text = columns[8];
      const Artskonto = columns[9];
      const PSP = columns[10];
      const SIO = columns[11];
      const Notat = columns[12];
  
      // Create objects based on extracted values
      const obj1 = { name: "Reference", value: name1, operator };
      const obj2 = { name: "Advisliste", value: name2, operator: null };
      const obj3 = { name: "Afsender", value: name3, operator: null };
      const obj4 = { name: "Posteringstype", value: name4, operator: null };
      const obj5 = { name: "Beløb", value1, value2, operator: valueOperator };
      const obj6 = {
          name: "Kontering",
          text,
          Artskonto,
          PSP,
          SIO: SIO === "" ? null : SIO,
          Notat,
      };
      // Create the array of objects
      return [obj1, obj2, obj3, obj4, obj5, obj6];
  });
  
  msg.payload = jsonData; // Assign the converted JSON data to msg.payload
  return msg; // Return the modified msg object with the converted JSON data
  
}

module.exports = Node;