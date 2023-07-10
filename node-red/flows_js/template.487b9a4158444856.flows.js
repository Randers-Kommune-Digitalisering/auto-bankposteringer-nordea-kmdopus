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
  background-color: #d6d6d6;
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
  background-color: #EAEDF0;
  border-radius: 5px;
  position: relative;
  overflow-x: visible;
  display: grid;
  justify-content: start;
  align-items: flex-start;
}

.ruleBox > h1 {
  background-color: #1B365D;
  line-height: 70px;
  color: white;
  padding-left: 18px;
  font-size: 20px;
  font-family: 'Roboto Slab';
  font-weight: 400;
  text-transform: uppercase;
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
}

button {
  background-color: #D6DAE2;
  border: none;
  padding: 2px 11px;
  cursor: pointer;
  border-radius: 5px;
  transition: transform 0.2s;
  font-size: 22px;
  width: -webkit-fill-available;
}

button:hover {
  transform: scale(1.1);
}

`

module.exports = Node;