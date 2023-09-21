const Node = {
  "id": "554f33cc9a0f201b",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "c076bc29b23b9bd7",
  "name": "JavaScript",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 410,
  "y": 320,
  "wires": [
    [
      "7b5552a2187320fb"
    ]
  ],
  "_order": 116
}

Node.template = `
const ruleWrapper = document.querySelector(".ruleWrapper");
const addRule = document.querySelector(".addRuleButton");
let deleteRuleButtons; // bliver defineret i runtime, så knapperne rent faktisk er genereret
let toggleButtons;
let inputs;
let selects;
const rules = _rules != null ? _rules : [];
const inactiveRules = rules.filter(rule => !rule[6].active);
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


let currentURL = window.location.href; // Get the current URL as a string
const navLinks = document.getElementsByTagName("ul")[0].getElementsByTagName("a");
for (let i = 0; i < navLinks.length; i++) {
    let linkURL = navLinks[i].href; // Get the href attribute of the link

    if (linkURL === currentURL) {
        navLinks[i].className = "current";
    }
}


// Send aktivitet til backend
function PublishWsMessage(m) {
    if (ws) {
        console.log("Sending WS message:", m);
        ws.send(m);
    }
}

// Sæt eksisterende regler ind på siden
function generateRule(activeRule) {
    const fragment = document.createDocumentFragment();
    let section = document.createElement("section");
    let h2 = document.createElement("h2");

    h2.textContent = parseInt(activeRule[7].ruleId) + 1;
    section.appendChild(h2);
    let div = document.createElement("div");

    for (let i = 0; i < Object.keys(activeRule).length - 2; i++) {       // - 2 fordi de sidste to properties ikke skal displayes
        const delregel = activeRule[i];
        let article = document.createElement("article");
        let h3 = document.createElement("h3");

        switch (i) {
            case 5:
                let inputPosteringstekst = document.createElement("input");
                inputPosteringstekst.id = "input_Posteringstekst_value_" + activeRule[7].ruleId;
                inputPosteringstekst.value = delregel.Posteringstekst || "";
                inputPosteringstekst.style.width = "300px";
                let inputArtskonto = document.createElement("input");
                inputArtskonto.id = "input_Artskonto_value_" + activeRule[7].ruleId;
                inputArtskonto.value = delregel.Artskonto || "";
                inputArtskonto.style.width = "85px";
                let inputPSP = document.createElement("input");
                inputPSP.id = "input_PSP_value_" + activeRule[7].ruleId;
                inputPSP.value = delregel.PSP || "";
                inputPSP.style.width = "170px";
                let inputNotat = document.createElement("input");
                inputNotat.id = "input_Notat_value_" + activeRule[7].ruleId;
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
                select.id = \`input_\${delregel.name}_operator_\${activeRule[7].ruleId}\`;
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
                input1.id = \`input_\${delregel.name}_value1_\${activeRule[7].ruleId}\`;
                input1.value = !delregel.value1 ? "" : delregel.value1;
                article.appendChild(input1);
                let input2 = document.createElement("input");
                input2.id = \`input_\${delregel.name}_value2_\${activeRule[7].ruleId}\`;
                input2.value = !delregel.value2 ? "" : delregel.value2;
                article.appendChild(input2);
                break;
            case 5:
                break;
            default:
                let input = document.createElement("input");
                input.id = \`input_\${delregel.name}_value_\${activeRule[7].ruleId}\`;
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
    deleteRuleButton.id = \`deleteRuleButton_\${activeRule[7].ruleId}\`;
    deleteRuleButton.textContent = "Slet regel";
    section.appendChild(deleteRuleButton);
    let toggleButton = document.createElement("button");
    toggleButton.className = "toggleButton";
    toggleButton.id = \`toggleButton_\${activeRule[7].ruleId}\`;
    toggleButton.textContent = "Aktivér regel";
    section.appendChild(toggleButton);
    fragment.appendChild(section);

    return fragment;
}

function generateNewRule() {
    let oldRuleId = rules[rules.length - 1][7].ruleId;
    let newRuleId = parseInt(oldRuleId) + 1;
    console.log(rules[0])
    const newRule = Object.keys(rules[0]).map((delregel) => {
        switch (delregel) {
            case "7":
                return { ruleId: newRuleId };
            case "6":
                return { active: false };
            case "5":
                return {
                    name: delregel.name,
                    Posteringstekst: "",
                    Artskonto: null,
                    PSP: null,
                    SIO: null,
                    Notat: "",
                };
            case "4":
                return {
                    name: delregel.name,
                    value1: null,
                    value2: null,
                    operator: "",
                };
            default:
                return {
                    name: delregel.name,
                    value: null,
                    operator: "",
                };
        }
    });
    rules.push(newRule);
    ruleWrapper.innerHTML = "";
    for (let i = 0; i < inactiveRules.length; i++) {
        ruleWrapper.appendChild(generateRule(inactiveRules[i]));
    }
    PublishWsMessage(JSON.stringify(rules));
    console.log(\`New rule with id \${newRuleId} added\`);
}

function updateValue(inputField, ruleIdIndex) {
    if (ruleIdIndex >= 0 && ruleIdIndex < rules.length) {
        const id = inputField.id; // e.g., input_afsender_value
        const sid = id.split("_"); // e.g., input, afsender, value

        const ruleObject = rules[ruleIdIndex].find(rule => {
            if (sid[1] === "Posteringstekst" || sid[1] === "Artskonto" || sid[1] === "PSP" || sid[1] === "Notat") {
                return sid[1] in rule;
            }
            return rule.name === sid[1];
        });

        if (ruleObject) {
            const updatedRuleObject = { ...ruleObject, };
            if (sid[1] === "Posteringstekst" || sid[1] === "Artskonto" || sid[1] === "PSP" || sid[1] === "Notat") {
                updatedRuleObject[sid[1]] = inputField.value;
            } else {
                updatedRuleObject[sid[2]] = inputField.value;
            }
            rules[ruleIdIndex] = [
                ...rules[ruleIdIndex].filter(rule => rule !== ruleObject),
                updatedRuleObject,
            ];
            PublishWsMessage(JSON.stringify(rules));
            console.log(\`Rule \${ruleIdIndex}, \${updatedRuleObject} updated\`);
        }
    }
}

function deleteRule(ruleIndex) {
    if (ruleIndex >= 0 && ruleIndex < rules.length) {
        rules.splice(ruleIndex, 1);
        PublishWsMessage(JSON.stringify(rules));
        ruleWrapper.innerHTML = "";
        for (let i = 0; i < inactiveRules.length; i++) {
            ruleWrapper.appendChild(generateRule(inactiveRules[i]));
        }
    }
    console.log(\`Rule \${ruleIndex} deleted\`);
}

function toggleRule(ruleIndex) {
    if (ruleIndex >= 0 && ruleIndex < rules.length) {
        rules[ruleIndex][6].active = !rules[ruleIndex][6].active;
        PublishWsMessage(JSON.stringify(rules));
        ruleWrapper.innerHTML = "";
        for (let i = 0; i < inactiveRules.length; i++) {
            ruleWrapper.appendChild(generateRule(inactiveRules[i]));
        }
    }
    console.log(\`Rule \${ruleIndex} active-status toggled\`)
}

function listenToEvents() {
    for (let i = 0; i < inactiveRules.length; i++) {
        const ruleId = inactiveRules[i][7].ruleId;
        deleteRuleButtons[i].addEventListener("click", () => {
            deleteRule(ruleId)
        });
        inputs[i].addEventListener("change", () => {
            updateValue(inputs[i], ruleId)
        });
        selects[i].addEventListener("change", () => {
            updateValue(selects[i], ruleId)
        });
        toggleButtons[i].addEventListener("click", () => {
            toggleRule(ruleId)
        });
    }
    addRule.addEventListener("click", () => { generateNewRule() });
    window.addEventListener("DOMContentLoaded", function () {
        const currentURL = window.location.href;
        const navLinks = document.querySelectorAll("ul a");

        navLinks.forEach(function (link) {
            if (link.href === currentURL) {
                link.classList.add("active");
                // Optionally, you can add the "active" class to the parent <li> element as well
                if (link.parentElement.tagName === "LI") {
                    link.parentElement.classList.add("active");
                }
            }
        });
    });
}

// WEB SOCKET start
var ws;
var wsUri = "ws:";
var loc = window.location; //console.log(loc);

if (loc.protocol === "https:") { wsUri = "wss:"; }
// This needs to point to the web socket in the Node-RED flow
wsUri += "//" + loc.host + loc.pathname.replace("info", "ws/info");

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
for (let i = 0; i < inactiveRules.length; i++) {
    ruleWrapper.appendChild(generateRule(inactiveRules[i]));
}

deleteRuleButtons = document.querySelectorAll(".deleteRuleButton");
toggleButtons = document.querySelectorAll(".toggleButton");
inputs = document.getElementsByTagName("input");
selects = document.getElementsByTagName("select");

listenToEvents();
// RUNTIME end
`

module.exports = Node;