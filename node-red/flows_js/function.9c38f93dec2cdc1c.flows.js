const Node = {
  "id": "9c38f93dec2cdc1c",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "59157a3330ff3d2f",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 525,
  "y": 240,
  "wires": [
    [
      "95ea38a4344edd26"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  // data sets to accountingRules when matching script has run once during uptime, initial config data if not
  let data = global.get("dateOfOrigin") ? global.get("accountingRules") : global.get("configs").initialData.accountingRules;
  
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
  
      let sqlQuery = `INSERT INTO accountingRules (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
      msg.sql = sqlQuery;
      
  }
  
  return msg;
  
}

module.exports = Node;