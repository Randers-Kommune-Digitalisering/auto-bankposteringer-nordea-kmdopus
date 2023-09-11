const Node = {
  "id": "29072b253e3c176d",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "a72cb7bc6d1977da",
  "name": "CSS",
  "field": "payload.style",
  "fieldType": "msg",
  "format": "css",
  "syntax": "mustache",
  "template": "",
  "x": 270,
  "y": 140,
  "wires": [
    [
      "14ecbe68b9c7d5cb"
    ]
  ],
  "_order": 132
}

Node.template = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400&family=Roboto:wght@900&display=swap');

* {
  font-family: 'Roboto Slab';
  font-weight: 300;
  font-size: 13px;
}

input, select {
  border-radius: 3px;
  background-color: whitesmoke;
  border: 1px solid #ebebeb;
  height: 50px;
  padding: 0px 10px;
  font-weight: 300;
}

input {
  background: linear-gradient(whitesmoke, #fafafa);
  border-right: 20px;
}

select {
  background: linear-gradient(whitesmoke, #e8e8e8);
  width: -webkit-fill-available;
}

input:focus, select:focus {
  outline: 1px solid #FAE100;
}

input:disabled, select:disabled {
  color: #737373!important;
  opacity: 1!important;
}

h2 {
  text-transform: uppercase;
  font-weight: 400;
  font-size: 40px;
}

h3 {
  font-weight: 400;
  align-items: center;
  display: contents;
}

pad_small {
  padding-left: 10px;
}

body {
  background-color: #EAEDF0;
  flex: content;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

main {
  display: flex;
  justify-content: start;
  align-items: flex-start;
}

.ruleBox {
  border-radius: 5px;
  display: grid;
}

.ruleBox > h1 {
  background-color: #1B365D;
  line-height: 80px;
  color: white;
  font-size: 40px;
  font-family: 'Roboto Slab';
  font-weight: 400;
  text-transform: uppercase;
  width: -webkit-fill-available;
  display: flex;
  justify-content: center;
  margin: auto;
  border-radius: 5px;
}

.ruleBox > .subheader {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  padding: 15px;
  text-transform: uppercase;
  font-weight: 400;
  background-color: #737373;
  color: white;
  border-left: 2px solid whitesmoke;
  border-right: 2px solid whitesmoke;
}

.ruleBox .ruleWrapper {
  display: grid;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
  padding: 10px;
}

.ruleWrapper > section {
  display: grid;
  position: relative;
  gap: 5px;
  padding: 10px;
  border-radius: 5px;
  flex-wrap: wrap;
  justify-items: center;
}

.ruleWrapper > section:hover {
  background-color: #ffffff;
  box-shadow: 5px 5px 5px #d6d6d6;
  outline: 0px;
}

.ruleWrapper > section > span:first-of-type {
  width: 50%;
  font-size: 15px;
}

.ruleWrapper > section > div {
  display: flex;
  position: relative;
  gap: 5px;
  padding: 10px;
  align-items: initial;
  border-radius: 5px;
  flex-wrap: wrap;
}

.ruleWrapper > section > div > article {
  display: grid;
  position: relative;
  gap: 5px;
  padding: 10px;
  align-items: center;
  border-radius: 5px;
  background-color: #EAEDF0;
  justify-items: center;
}

.ruleWrapper > section > div > article:focus-within {
  outline: 1px solid #FAE100;
}

.ruleWrapper .spacing {
  flex-grow: 0;
}

footer {
  padding: 10px;
  margin: 12px;
  width: -webkit-fill-available;
}

button {
  background-color: #D6DAE2;
  border: none;
  padding: 2px 11px;
  cursor: pointer;
  border-radius: 5px;
  transition: transform 0.2s;
  font-size: 15px;
  width: -webkit-fill-available;
}

button:hover {
  background-color: #1B365D;
  text-transform: uppercase;
}

.addRuleButton:hover {
  color: white;
}

.deleteRowButton:hover {
  color: red;
}
`

module.exports = Node;