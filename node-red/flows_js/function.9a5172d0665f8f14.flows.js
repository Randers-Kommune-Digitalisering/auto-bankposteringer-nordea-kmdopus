const Node = {
  "id": "9a5172d0665f8f14",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Update",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 115,
  "y": 560,
  "wires": [
    [
      "6933f3c645c88921"
    ]
  ],
  "icon": "font-awesome/fa-pencil",
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
  
  valueString += "WHERE ruleID = " + data.ruleID;
  
  let sqlQuery = `UPDATE accountingRules SET ${valueString}`;
  msg.sql = sqlQuery;
  
  return msg;
  
}

module.exports = Node;