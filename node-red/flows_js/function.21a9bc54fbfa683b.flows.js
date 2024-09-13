const Node = {
  "id": "21a9bc54fbfa683b",
  "type": "function",
  "z": "32cf2bec698ca424",
  "g": "a6213de5d0ba3b76",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1075,
  "y": 440,
  "wires": [
    [
      "f2ad8463279f9f76",
      "3d65585d175ec2cd"
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