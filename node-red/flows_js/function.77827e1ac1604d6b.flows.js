const Node = {
  "id": "77827e1ac1604d6b",
  "type": "function",
  "z": "202e1898db8daa8b",
  "g": "132962a7a75a51ea",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 915,
  "y": 80,
  "wires": [
    [
      "088eb9e6e51a6828"
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
  
  
  let sqlQuery = `INSERT INTO accountingRules (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;