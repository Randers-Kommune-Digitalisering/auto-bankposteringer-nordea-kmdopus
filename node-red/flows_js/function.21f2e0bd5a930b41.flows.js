const Node = {
  "id": "21f2e0bd5a930b41",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Insert",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 115,
  "y": 520,
  "wires": [
    [
      "6933f3c645c88921"
    ]
  ],
  "icon": "font-awesome/fa-plus",
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