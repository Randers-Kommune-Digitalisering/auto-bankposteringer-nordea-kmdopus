const Node = {
  "id": "dcffc9199e91bad3",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "b56ac63d41e82307",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 515,
  "y": 740,
  "wires": [
    [
      "8075f885132debb6"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = 
  [
      {
          "bankAccount": "DK20005908764988-DKK",
          "bankAccountName": "Hovedkonto",
          "statusAccount": 90540000,
          "intermediateAccount": 95990009
      },
      { 
          "bankAccount": "DK20009035615315-DKK",
          "bankAccountName": "Debitorkonto",
          "statusAccount": 90541000,
          "intermediateAccount": 95991009
      }
  ];
  
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
  
      let sqlQuery = `INSERT INTO bankAccounts (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
      msg.sql = sqlQuery;
      
  } else {
      node.warn = "No data available";
  }
  
  return msg;
  
}

module.exports = Node;