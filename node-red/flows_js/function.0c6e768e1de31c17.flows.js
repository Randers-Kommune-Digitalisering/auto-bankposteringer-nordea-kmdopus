const Node = {
  "id": "0c6e768e1de31c17",
  "type": "function",
  "z": "202e1898db8daa8b",
  "g": "26bee64ab44fc005",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1305,
  "y": 100,
  "wires": [
    [
      "949398f756b76f78"
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
  
      if (index < columns.length - 1)
          valueString += ",";
  
      valueString += "\n";
  
  }
  
  valueString += "WHERE admID = " + data.admID;
  
  let sqlQuery = `UPDATE accountingRules SET ${valueString}`;
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;