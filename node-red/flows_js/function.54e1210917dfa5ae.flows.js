const Node = {
  "id": "54e1210917dfa5ae",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "e8e6c41949b01e67",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 505,
  "y": 460,
  "wires": [
    [
      "73566ef987f29612"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = global.get("configs").initialData.bankAccounts;
  let name = global.get("configs").names.bankAccounts;
  
  if (Array.isArray(data) && data.length > 0) {
      // Get the keys from the first object to use as column names
      let columns = Object.keys(data[0]);
  
      // Map over the array to generate values strings
      let rows = data.map(item => {
          let values = columns.map(col => {
              let value = item[col];
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
          return `(${values.join(', ')})`;
      });
  
      let sqlQuery = `INSERT INTO ${name} (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
      msg.sql = sqlQuery;
      
  }
  
  return msg;
  
}

module.exports = Node;