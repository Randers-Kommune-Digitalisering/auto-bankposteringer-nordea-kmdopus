const Node = {
  "id": "85fc62df12de2fdd",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "7208899b1498cc2d",
  "name": "set global vars",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "dayjs",
      "module": "dayjs"
    }
  ],
  "x": 305,
  "y": 60,
  "wires": [
    [
      "5e4c16d66475c6db"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false,
  "info": ""
}

Node.info = `
Format: ISO 8601
`

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  function findDate(arg) {
      let startDate = dayjs().startOf('day');
      let endDate = dayjs().endOf('day').subtract(1, 'day');
  
      if (startDate.day() === 1) { // If today is Monday
          startDate = startDate.subtract(3, 'day');
      } else {
          startDate = startDate.subtract(1, 'day');
      }
  
      if (arg === "start") {
          return startDate.format('YYYY-MM-DD');
      } else if (arg === "end") {
          return endDate.format('YYYY-MM-DD');
      }
  }
  
  // Set global variables
  global.set("startdate", findDate("start"));
  global.set("enddate", findDate("end"));
  global.set("dateOfOrigin", dayjs().format('YYYYMMDD'));
  global.set("timeOfOrigin", dayjs().format('HHmmss'));
  
  return msg;
  
}

module.exports = Node;