const Node = {
  "id": "5e2d001a326df862",
  "type": "function",
  "z": "202e1898db8daa8b",
  "g": "2677659fd0ff4476",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1675,
  "y": 100,
  "wires": [
    [
      "bfab8bfa34b8d926",
      "042e801b9b2ce9fb"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = flow.get("bankAccounts");
  
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
  
  let sqlQuery = `INSERT INTO bankAccounts (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;