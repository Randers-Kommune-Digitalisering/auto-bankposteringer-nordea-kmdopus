const Node = {
  "id": "6907248a9472ae39",
  "type": "function",
  "z": "32cf2bec698ca424",
  "g": "e3a1fa8058d9a961",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 385,
  "y": 280,
  "wires": [
    [
      "a815b5b63f39be37"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = msg.payload;
  let name = global.get("configs").names.accountingRules;
  
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
  
  let sqlQuery = `UPDATE ${name} SET ${valueString}`;
  msg.sql = sqlQuery;
  
  return msg;
  
}

module.exports = Node;