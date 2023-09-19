const Node = {
  "id": "4787b43fdde8f910",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "a72cb7bc6d1977da",
  "name": "JavaScript",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 130,
  "y": 140,
  "wires": [
    [
      "29072b253e3c176d"
    ]
  ],
  "_order": 142
}

Node.template = `
const ruleWrapper = document.querySelector(".ruleWrapper");
const addRule = document.querySelector(".addRuleButton");

let deleteRuleButtons; //= document.querySelectorAll(".deleteRuleButton");
let toggleButtons; //= document.querySelectorAll(".toggleButton");
let inputs; //= document.getElementsByTagName("input");
let selects; //= document.getElementsByTagName("select");

const rules = _rules != null ? _rules.map((rule, index) => ({ ...rule, 7: { ruleId: index } })) : [];
const activeRules = rules.filter(rule => rule[6].active);
const inputFields = { 0: "Reference", 1: "Advisliste", 2: "Afsender", 3: "Posteringstype", 4: "Beløb1", 5: "Beløb2", 6: "Posteringstekst", 7: "Artskonto", 8: "PSP", 9: "SIO", 10: "Notat" };
const textOperators = [
    { "name": "= Skal være lig med", "value": "==" },
    { "name": "{?} Indeholder", "value": "contains" },
    { "name": "{!} Indeholder ikke", "value": "!contains" },
    { "name": "[o] Skal være oplyst", "value": "!null" },
    { "name": "[...] Starter med", "value": ".startsWith" },
    { "name": "Slutter med [...]", "value": ".endsWith" }
]
const valueOperators = [
    { "name": "= Skal være lig med", "value": "==" },
    { "name": "≠ Må ikke være lig med", "value": "!=" },
    { "name": "< Skal være mindre end", "value": "<" },
    { "name": "> Skal være større end", "value": ">" },
    { "name": "< Mellem <", "value": ">< " },
]

// Send aktivitet til backend
function PublishWsMessage(m) {
    if (ws) {
        console.log("Sending WS message:", m); // Log the message being sent
        ws.send(m);
    }
}

// Sæt eksisterende regler ind på siden
function generateRule(ruleIdIndex, activeRule) {
    const fragment = document.createDocumentFragment();
    let section = document.createElement("section");
    let h2 = document.createElement("h2");
    h2.textContent = activeRule[7].ruleId;
    section.appendChild(h2);
    let div = document.createElement("div");

    for (let i = 0; i < Object.keys(activeRule).length - 2; i++) {       // - 2 fordi de sidste to properties ikke skal displayes
        const delregel = activeRule[i];
        let article = document.createElement("article");
        let h3 = document.createElement("h3");

        switch (i) {
            case 5:
                let inputPosteringstekst = document.createElement("input");
                inputPosteringstekst.id = "input_Posteringstekst_value";
                inputPosteringstekst.value = delregel.Posteringstekst || "";
                inputPosteringstekst.style.width = "300px";
                let inputArtskonto = document.createElement("input");
                inputArtskonto.id = "input_Artskonto_value";
                inputArtskonto.value = delregel.Artskonto || "";
                inputArtskonto.style.width = "85px";
                let inputPSP = document.createElement("input");
                inputPSP.id = "input_PSP_value";
                inputPSP.value = delregel.PSP || "";
                inputPSP.style.width = "170px";
                let inputNotat = document.createElement("input");
                inputNotat.id = "input_Notat_value";
                inputNotat.value = delregel.Notat || "";
                inputNotat.style.width = "700px";
                let articlePosteringstekst = document.createElement("article");
                let h3Posteringstekst = document.createElement("h3");
                h3Posteringstekst.textContent = "Posteringstekst";
                articlePosteringstekst.appendChild(h3Posteringstekst);
                articlePosteringstekst.appendChild(inputPosteringstekst);
                let articleArtskonto = document.createElement("article");
                let h3Artskonto = document.createElement("h3");
                h3Artskonto.textContent = "Artskonto";
                articleArtskonto.appendChild(h3Artskonto);
                articleArtskonto.appendChild(inputArtskonto);
                let articlePSP = document.createElement("article");
                let h3PSP = document.createElement("h3");
                h3PSP.textContent = "PSP";
                articlePSP.appendChild(h3PSP);
                articlePSP.appendChild(inputPSP);
                let articleNotat = document.createElement("article");
                let h3Notat = document.createElement("h3");
                h3Notat.textContent = "Notat";
                articleNotat.appendChild(h3Notat);
                articleNotat.appendChild(inputNotat);
                div.appendChild(articlePosteringstekst);
                div.appendChild(articleArtskonto);
                div.appendChild(articlePSP);
                div.appendChild(articleNotat);
                break;
            default:
                h3.textContent = delregel.name;
                let select = document.createElement("select");
                select.id = \`input_\${delregel.name}_operator\`;
                const operators = i === 4 ? valueOperators : textOperators;

                for (let j = 0; j < operators.length; j++) {
                    let option = document.createElement("option");
                    option.value = operators[j].value;
                    option.text = operators[j].name;

                    if (delregel.operator == operators[j].value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
                article.appendChild(h3);
                article.appendChild(select);
        }

        switch (i) {
            case 4:
                let input1 = document.createElement("input");
                input1.id = \`input_\${delregel.name}_value1\`;
                input1.value = !delregel.value1 ? "" : delregel.value1;
                article.appendChild(input1);
                let input2 = document.createElement("input");
                input2.id = \`input_\${delregel.name}_value2\`;
                input2.value = !delregel.value2 ? "" : delregel.value2;
                article.appendChild(input2);
                break;
            case 5:
                break;
            default:
                let input = document.createElement("input");
                input.id = \`input_\${delregel.name}_value\`;
                input.value = !delregel.value ? "" : delregel.value;
                article.appendChild(input);
                break;
        }

        switch (i) {
            case 5:
                break;
            default:
                div.appendChild(article);
                break;
        }
    }
    section.appendChild(div);

    let deleteRuleButton = document.createElement("button");
    deleteRuleButton.className = "deleteRuleButton";
    deleteRuleButton.textContent = "Slet regel";
    //deleteRuleButton.setAttribute("onclick", \`deleteRule(\${ruleIdIndex})\`);
    section.appendChild(deleteRuleButton);
    let toggleButton = document.createElement("button");
    toggleButton.className = "toggleButton";
    toggleButton.textContent = "Deaktivér regel";
    //toggleButton.setAttribute("onclick", \`toggleRule(\${ruleIdIndex})\`);
    section.appendChild(toggleButton);
    fragment.appendChild(section);

    return fragment;
}



// Lav ny tom linje
function generateNewRow() {
    // Create a new row object that matches the structure of the other rows
    const newRule = rules[0].map((obj, i) => {
        switch (i) {
            case 6:
                return {
                    active: true
                };
            case 5:
                return {
                    name: obj.name,
                    Posteringstekst: "",
                    Artskonto: null,
                    PSP: null,
                    SIO: null,
                    Notat: "",
                };
            case 4:
                return {
                    name: obj.name,
                    value1: null,
                    value2: null,
                    operator: "",
                };
            default:
                return {
                    name: obj.name,
                    value: null,
                    operator: "",
                };
        }
    });
    rules.push(newRule);
    ruleWrapper.innerHTML = "";
    for (let i = 0; i < activeRules.length; i++) {
        ruleWrapper.appendChild(generateRule(activeRules[i].ruleId, activeRules[i]));
    }

    PublishWsMessage(JSON.stringify(rules));
    console.log("New rule added");
}



// Ved opdatering af input eller select value
function updateValue(inputField, ruleIdIndex) {
    let id = inputField.id;   // e.g., input_afsender_value
    let sid = id.split("_");  // e.g., input, afsender, value
    let ruleObject = null;
    let konteringPointer = false;
    let ruleIndex = -1;
    let innerIndex = -1;

    if (ruleIdIndex >= 0 && ruleIdIndex < rules.length) {
        for (let j = 0; j < rules[ruleIdIndex].length; j++) {
            switch (j) {
                case 5:
                    if (sid[1] in rules[ruleIdIndex][j]) {
                        ruleObject = rules[ruleIdIndex][j];
                        ruleIndex = ruleIdIndex;
                        innerIndex = j;
                        konteringPointer = true;
                        break;
                    }
                    break;
                default:
                    if (rules[ruleIdIndex][j].name === sid[1]) {
                        ruleObject = rules[ruleIdIndex][j];
                        ruleIndex = ruleIdIndex;
                        innerIndex = j;
                        break;
                    }
                    break;
            }
        }
    }
    if (ruleObject) {
        let updatedRuleObject = null;
        if (konteringPointer) {
            updatedRuleObject = {
                ...ruleObject,
                [sid[1]]: inputField.value,
            };
        } else {
            updatedRuleObject = {
                ...ruleObject,
                [sid[2]]: inputField.value,
            };
        }
        rules[ruleIndex][innerIndex] = updatedRuleObject;
        PublishWsMessage(JSON.stringify(rules));
    }

    console.log("Saving user input to rules...");
}


// Slet en regel
function deleteRule(rowIndex) {
    if (rowIndex >= 0 && rowIndex < rules.length) {
        rules.splice(rowIndex, 1);
        PublishWsMessage(JSON.stringify(rules));
        requestAnimationFrame(() => {
            const ruleSection = ruleWrapper.children[rowIndex];
            if (ruleSection) {
                ruleWrapper.removeChild(ruleSection);
            }
            // Update the remaining row indices if needed
            for (let i = rowIndex; i < ruleWrapper.children.length; i++) {
                const ruleElement = ruleWrapper.children[i];
                const h2 = ruleElement.querySelector("h2");
                h2.textContent = i + 1;
            }
        });
    }
    console.log(\`Rule \${rowIndex} deleted\`);
}

// Aktiver eller deaktiver en regel
function toggleRule(rowIndex) {
    if (rowIndex >= 0 && rowIndex < rules.length) {
        rules[rowIndex][6].active = !rules[rowIndex][6].active;
        PublishWsMessage(JSON.stringify(rules));
        const ruleSection = ruleWrapper.children[rowIndex];
        ruleWrapper.removeChild(ruleSection);
    }
    console.log("Rule active-status toggled")
}


function testFor()
{

    const length = activeRules.length;

    for (let i = 0; i < length; i++)
    {
        console.log("i: " + i);
    }
}

// Bro mellem brugeraktivitet og sidens funktioner. Alle knapper er indekseret efter activeRules, da det er hvad der displayes på siden.
function listenToEvents() {
    for (let i = 0; i < activeRules.length; i++)
    {
        const ruleId = activeRules[i][7].ruleId; // Access ruleId at index 7


        
        //console.log("listenToEvents(): i = " + i + ", ruleID = " + ruleId);
        //console.log("Length: " + activeRules.length);

        deleteRuleButtons[i].addEventListener("click", function(){ deleteRule(ruleId) });
        
        inputs[i].addEventListener("change", function () { updateValue(inputs[i], ruleId) });

        selects[i].addEventListener("change", function () { updateValue(selects[i], ruleId) });

        toggleButtons[i].addEventListener("click", function () { toggleRule(ruleId) });

    }
    addRule.addEventListener("click", generateNewRow );
}



// WEB SOCKET start
var ws;
var wsUri = "ws:";
var loc = window.location; //console.log(loc);

if (loc.protocol === "https:") { wsUri = "wss:"; }
// This needs to point to the web socket in the Node-RED flow
wsUri += "//" + loc.host + loc.pathname.replace("rules", "ws/rules");

function wsConnect() {
    console.log("Connecting to ", wsUri);
    ws = new WebSocket(wsUri);
    ws.onmessage = function (msg) {
        // parse the incoming message as a JSON object
        var data = msg.data;
        const obj = JSON.parse(data);
        console.log("Received WS message: " + JSON.stringify(obj));
        //ws.send(JSON.stringify({data:data}));
    }
    ws.onopen = function () {
        // update the status div with the connection status
        console.log("Connected to WS");
    }
    ws.onclose = function () {
        // update the status div with the connection status
        console.log("WS connection lost");
        // in case of lost connection tries to reconnect every 3 secs
        setTimeout(wsConnect, 3000);
    }
}
// WEB SOCKET end

// RUNTIME start
ruleWrapper.innerHTML = "";
for (let i = 0; i < activeRules.length; i++) {
    ruleWrapper.appendChild(generateRule(activeRules[i].ruleId, activeRules[i]));
}

deleteRuleButtons = document.querySelectorAll(".deleteRuleButton");

console.log("Rule button count: " + deleteRuleButtons.length);

toggleButtons =     document.querySelectorAll(".toggleButton");
inputs =            document.getElementsByTagName("input");
selects =           document.getElementsByTagName("select");

listenToEvents();
// RUNTIME end
`

module.exports = Node;