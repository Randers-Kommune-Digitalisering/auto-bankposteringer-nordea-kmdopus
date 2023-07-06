const Node = {
  "id": "487b9a4158444856",
  "type": "template",
  "z": "97cc6bce53027f96",
  "name": "CSS",
  "field": "payload.style",
  "fieldType": "msg",
  "format": "css",
  "syntax": "mustache",
  "template": "",
  "x": 690,
  "y": 320,
  "wires": [
    [
      "d090ea5469fc5949"
    ]
  ],
  "_order": 85
}

Node.template = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400&family=Roboto:wght@900&display=swap');

* {
  box-sizing: border-box;
  font-family: 'Roboto Slab';
  font-weight: 300;
  font-size: 13px;
}

input, select {
  border-radius: 3px;
  background-color: whitesmoke;
  border: 1px solid #ebebeb;
  line-height: 35px;
  min-height: 37px;
  padding: 0px 10px;
  font-weight: 300;
}

input {
  background: linear-gradient(whitesmoke, #fafafa);
  border-right: 20px;
}

select {
  background: linear-gradient(whitesmoke, #e8e8e8);
}

input:focus, select:focus {
  outline: 1px solid #FAE100;
}

input:disabled, select:disabled {
  color: #737373!important;
  opacity: 1!important;
}

h1 {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 5px;
  width: 70px;
  max-width: 70px;
  text-transform: uppercase;
  font-weight: 400;
  background-color: #4077b9;
  color: white;
  border-left: 2px;
  border-right: 12px;
  position: sticky;
  position: -webkit-sticky;
}

h2 {
  font-weight: 400;
}

pad_small {
  padding-left: 10px;
}

button {
  background-color: #4077b9;
  color: #ffffff;
  border: none;
  padding: 5px 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.1);
}

body {
  background-color: #d6d6d6;
  flex: content;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
}

.ruleContainer {
  height: 100vh;
  width: 100%;
  max-width: 100vw;
  display: flex;
  justify-content: start;
  align-items: flex-start;
  overflow-x: auto;
}

.ruleBox {
  background-color: white;
  border-radius: 5px;
  position: relative;
  overflow-x: visible;
  display: grid;
  justify-content: start;
  align-items: flex-start;
}

.ruleBox > div.header {
  background-color: #1B365D;
  line-height: 70px;
  color: white;
  padding-left: 18px;
  font-size: 20px;
  font-family: 'Roboto Slab';
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid whitesmoke;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
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
  padding: 15px;
  border-left: 2px solid whitesmoke;
  border-right: 2px solid whitesmoke;
  overflow-x: visible;
}

.ruleWrapper > div {
  display: flex;
  position: relative;
  gap: 5px;
}

.ruleWrapper > div:hover {
  background-color: #fafafa;
}

.ruleWrapper:last-of-type > div:last-child {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  border-bottom: 2px solid whitesmoke;
}

.ruleWrapper > div > span:first-of-type {
  width: 50%;
  font-size: 15px;
}

.ruleWrapper .spacing {
  flex-grow: 0;
}

`

module.exports = Node;