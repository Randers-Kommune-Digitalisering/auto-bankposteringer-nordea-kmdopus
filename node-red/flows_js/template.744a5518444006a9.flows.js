const Node = {
  "id": "744a5518444006a9",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "9b6c10170cad638d",
  "name": "CSS",
  "field": "payload.style",
  "fieldType": "msg",
  "format": "css",
  "syntax": "mustache",
  "template": "",
  "x": 1140,
  "y": 60,
  "wires": [
    [
      "d2465ea9ceb83c7d"
    ]
  ],
  "_order": 145
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
  outline: 1px solid #dfc900;
}

input:disabled, select:disabled {
  color: #737373!important;
  opacity: 1!important;
}

h1 {
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

h2 {
  display: list-item;
  list-style-type: "▶";
  text-transform: uppercase;
  font-weight: 400;
  font-size: 40px;
  margin-block-start: auto;
  margin-block-end: auto;
  padding-left: 15px;
}

h2::marker {
  color: #1B365D;
}

h3 {
  display: flex;
  font-weight: 400;
  font-size: 20px;
  margin-block-start: auto;
  margin-block-end: auto;
  width: 100%;
  justify-content: center;
  padding-bottom: 5px;
  border-bottom: solid #aac3e6;
}

h4 {
  margin-block: 0;
  font-weight: 400;
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
  align-items: flex-start;
}

.ruleBox {
  border-radius: 5px;
  display: grid;
  width: -webkit-fill-available;
}

.nav {
  background-color: #aac3e6;
  line-height: 40px;
  text-transform: uppercase;
  width: -webkit-fill-available;
  border-radius: 5px;
  list-style-type: none;
  padding-left: 10px;
  margin-top: 10px;
}

.nav > li {
  float: left;
  padding: 0px 5px 0px 5px;
}

.nav > li:hover * {
  background-color: #1B365D;
  color: white;
}

.nav > li > a {
  display: grid;
  font-size: 15px;
  font-weight: 400;
  font-family: 'Roboto Slab';
  text-decoration: none;
  color: #1B365D;
}

.nav > .active * {
  background-color: #1B365D;
  color: white;
}

.ruleWrapper {
  display: grid;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
}

section {
  display: flex;
  position: relative;
  gap: 5px;
  padding: 10px;
  border-radius: 5px;
  justify-content: space-between;
  align-items: center;
}

section:hover {
  background-color: #ffffff;
  box-shadow: 5px 5px 5px #c4c4c4;
  outline: 0px;
}

.articleContainer {
  flex-wrap: wrap;
  justify-content: center;
}

.articleContainer:hover {
  background-color: initial;
  box-shadow: none;
  outline: 0;
}

section > span:first-of-type {
  width: 50%;
  font-size: 15px;
}

div {
  display: flex;
  position: relative;
  gap: 5px;
  padding: 10px;
  flex-wrap: nowrap;
  align-items: center;
  border-radius: 5px;
}

article {
  display: grid;
  position: relative;
  gap: 5px;
  padding: 10px;
  align-items: center;
  border-radius: 5px;
  background-color: #EAEDF0;
  justify-items: center;
}

article:focus-within {
  outline: 1px solid #dfc900;
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
  background-color: #aac3e6;
  border: none;
  width: 200px;
  padding: 2px 11px;
  cursor: pointer;
  border-radius: 5px;
  transition: transform 0.2s;
  font-size: 15px;
}

button:hover {
  background-color: #1B365D;
  text-transform: uppercase;
}

.buttonContainer {
  display: grid;
}

.addRuleButton {
    width: -webkit-fill-available;
}

.addRuleButton:hover {
  color: white;
}

.deleteRuleButton:hover {
  color: red;
}

.toggleButton:hover {
  color: white;
}


`

module.exports = Node;