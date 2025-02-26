const Node = {
  "id": "3f71cd473ee6356c",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "704dc03174bd43e2",
  "name": "Insert",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 845,
  "y": 280,
  "wires": [
    [
      "47554be7fa0c6e02"
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
  
  
  let sqlQuery = `INSERT INTO transactionsWithNoMatch (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;