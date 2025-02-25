const Node = {
  "id": "b15f50f1e4c9a0c5",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Update",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 160,
  "y": 320,
  "wires": [
    [
      "02a9fad653aadd0a"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = msg.payload;
  
  // Get the keys from the first object to use as column names
  let columns = Object.keys(data);
  
  // Map over the array to generate values strings
  let values = columns.map(col => {
      let value = data[col];
      if (value === null) {
          return 'NULL';
      } else if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'boolean') {
          return value ? 'TRUE' : 'FALSE';
      } else {
          return value;
      }
  });
  
  
  let valueString = "";
  
  for (let index = 0; index < columns.length; index++) {
     
      valueString += columns[index] + " = " + values[index];
      
      if(index < columns.length -1)
          valueString += ",";
  
      valueString += "\n";
      
  }
  
  valueString += "WHERE RuleID = " + data.RuleID;
  
  let sqlQuery = `UPDATE accountingRules SET ${valueString}`;
  msg.sql = sqlQuery;
  
  return msg;
  
}

module.exports = Node;