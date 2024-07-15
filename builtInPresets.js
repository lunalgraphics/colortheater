let optgroup = document.querySelector("#builtInPresetsGroup");

let builtInPresets = [
    {
        "name": "Default",
        "value": `<ctpreset><basicAdj brightness="100" contrast="100" saturate="100" sepia="0"/><splitToning hColor="#ff5400" hAmnt="0" sColor="#0081ff" sAmnt="0"/><cMatrix><cell id="cell00">100</cell><cell id="cell01">0</cell><cell id="cell02">0</cell><cell id="cell03">0</cell><cell id="cell04">0</cell><cell id="cell10">0</cell><cell id="cell11">100</cell><cell id="cell12">0</cell><cell id="cell13">0</cell><cell id="cell14">0</cell><cell id="cell20">0</cell><cell id="cell21">0</cell><cell id="cell22">100</cell><cell id="cell23">0</cell><cell id="cell24">0</cell><cell id="cell30">0</cell><cell id="cell31">0</cell><cell id="cell32">0</cell><cell id="cell33">100</cell><cell id="cell34">0</cell></cMatrix><vignette color="#000000" scale="50" fill="0" blending="multiply"/><tint color="#004080" fill="0"/></ctpreset>`,
    },
    {
        "name": "Black & White Film",
        "value": `<ctpreset><basicAdj brightness="80" contrast="133" saturate="100" sepia="0"/><splitToning hColor="#ff5400" hAmnt="0" sColor="#0081ff" sAmnt="0"/><cMatrix><cell id="cell00">33</cell><cell id="cell01">33</cell><cell id="cell02">33</cell><cell id="cell03">0</cell><cell id="cell04">20</cell><cell id="cell10">33</cell><cell id="cell11">33</cell><cell id="cell12">33</cell><cell id="cell13">0</cell><cell id="cell14">20</cell><cell id="cell20">33</cell><cell id="cell21">33</cell><cell id="cell22">33</cell><cell id="cell23">0</cell><cell id="cell24">20</cell><cell id="cell30">0</cell><cell id="cell31">0</cell><cell id="cell32">0</cell><cell id="cell33">100</cell><cell id="cell34">0</cell></cMatrix><vignette color="#000000" scale="50" fill="0" blending="multiply"/><tint color="#004080" fill="0"/></ctpreset>`,
    },
    {
        "name": "Golden Hour",
        "value": `<ctpreset><basicAdj brightness="105" contrast="105" saturate="80" sepia="10"/><splitToning hColor="#ff5400" hAmnt="40" sColor="#0081ff" sAmnt="25"/><cMatrix><cell id="cell00">100</cell><cell id="cell01">0</cell><cell id="cell02">0</cell><cell id="cell03">0</cell><cell id="cell04">0</cell><cell id="cell10">0</cell><cell id="cell11">100</cell><cell id="cell12">0</cell><cell id="cell13">0</cell><cell id="cell14">0</cell><cell id="cell20">0</cell><cell id="cell21">0</cell><cell id="cell22">90</cell><cell id="cell23">0</cell><cell id="cell24">0</cell><cell id="cell30">0</cell><cell id="cell31">0</cell><cell id="cell32">0</cell><cell id="cell33">100</cell><cell id="cell34">0</cell></cMatrix><vignette color="#000000" scale="70" fill="70" blending="soft-light"/><tint color="#004080" fill="20"/></ctpreset>`,
    },
];

for (let preset of builtInPresets) {
    let option = document.createElement("option");
    option.value = preset["value"]
    option.innerHTML = preset["name"];
    optgroup.appendChild(option);
}