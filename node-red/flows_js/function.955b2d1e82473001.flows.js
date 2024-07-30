const Node = {
  "id": "955b2d1e82473001",
  "type": "function",
  "z": "VueExample",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 515,
  "y": 380,
  "wires": [
    [
      "61676c6c7947def6"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
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