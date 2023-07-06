const Node = {
  "id": "92fbd2f21b7bb5a1",
  "type": "template",
  "z": "97cc6bce53027f96",
  "name": "CSS backup",
  "field": "payload.style",
  "fieldType": "msg",
  "format": "css",
  "syntax": "mustache",
  "template": "",
  "x": 730,
  "y": 340,
  "wires": [
    []
  ],
  "_order": 98
}

Node.template = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400&family=Roboto:wght@900&display=swap');

*
{
    box-sizing: border-box;
    font-family: 'Roboto Slab';
    font-weight: 300;
    font-size: 13px;
}
input, select
{
    border-radius: 3px;
    background-color: whitesmoke;
    border: 1px solid #ebebeb;
    line-height: 35px;
    min-height: 37px;
    padding: 0px 10px;
    font-weight: 400;
}
input
{
    background: linear-gradient(whitesmoke, #fafafa);
    max-width: 250px;
}
select
{
    background: linear-gradient(whitesmoke, #e8e8e8);
}
input:focus, select:focus
{
    outline: 1px solid #FAE100;
}
input:disabled, select:disabled
{
    color: #737373!important;
    opacity: 1!important;
}

body
{
    padding-top: 0px;
    background-color: #d6d6d6;
    margin: 5px;
    flex: content;
    display: flex;
    justify-content: center;
}

.ruleBox
{
    width: 100vw;
    background-color: white;
    border-radius: 5px;
}

    .ruleBox > div.header
    {
        width: 100%;
        background: linear-gradient(#1B365D, #3c506e);
        /* background-color: #1B365D; /*#3c506e;*/
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
    .ruleBox > .subheader
    {
        width: 100%;
        padding: 10px 15px;
        text-transform: uppercase;
        font-weight: 400;
        background: linear-gradient(#737373, #878787);
        color: white;
        border-left: 2px solid whitesmoke;
        border-right: 2px solid whitesmoke;

    }
    .ruleBox .ruleWrapper
    {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

        .ruleWrapper > div /* RULE PARENT */
        {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 5px;
            padding: 15px;
            line-height: 35px;
            border-left: 2px solid whitesmoke;
            border-right: 2px solid whitesmoke;
        }
        .ruleWrapper > div:hover
        {
            width: 100%;
            background-color: #fafafa;
        }
        .ruleWrapper:last-of-type > div:last-child
        {
            border-bottom-left-radius: 5px;
            border-bottom-right-radius: 5px;
            border-bottom: 2px solid whitesmoke;
            
        }
            .ruleWrapper > div > span
            {
                flex-grow: 0;
            }
            /* .ruleWrapper span.valuetype
            {
                background-color: #DA1884;
                color: white;
                border-radius: 3px;
                padding: 0px 5px;
                opacity: 0.7;
            } */
            .ruleWrapper > div > span:first-of-type
            {
                width: 20%;
                font-size: 15px;
            }
            /* .ruleWrapper > div > span.description
            {
                background-color: #FAE100;
                border-radius: 3px;
                padding: 0px 10px;
                opacity: 0.7;
                color: black;
                font-size: 15px;
                font-weight: 400;
                cursor: help;
            } */
            .ruleWrapper .spacing
            {
                flex-grow: 0;
            }
`

module.exports = Node;