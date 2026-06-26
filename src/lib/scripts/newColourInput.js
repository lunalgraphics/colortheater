function setUpColorInputs() {
    for (let colourInput of document.querySelectorAll("input[type=color]")) {
        let wrapper = document.createElement("div");
        wrapper.style.display = "inline-block";
        colourInput.parentElement.insertBefore(wrapper, colourInput);
        colourInput.remove();
        wrapper.appendChild(colourInput);
        colourInput.style.opacity = 0;
        colourInput.style.width = "22.5px";
        colourInput.style.height = "22.5px";
        wrapper.style.backgroundColor = colourInput.value;
        colourInput.addEventListener("input", (e) => {
            wrapper.style.backgroundColor = e.target.value;
        });
        wrapper.style.border = "1px solid grey";
        wrapper.style.outline = "3px solid #222222";
        wrapper.style.outlineOffset = "-4px";
        let wrapperState = { hover: false, focus: false, };
        let updateBorder = () => {
            if (wrapperState["focus"]) {
                wrapper.style.borderColor = "white";
            }
            else if (wrapperState["hover"]) {
                wrapper.style.borderColor = "#A1A1A1";
            }
            else wrapper.style.borderColor = "grey";
        };
        wrapper.addEventListener("mouseenter", () => {
            wrapperState["hover"] = true;
            updateBorder();
        });
        wrapper.addEventListener("mouseleave", () => {
            wrapperState["hover"] = false;
            updateBorder();
        });
        colourInput.addEventListener("focus", () => {
            wrapperState["focus"] = true;
            updateBorder();
        });
        colourInput.addEventListener("blur", () => {
            wrapperState["focus"] = false;
            updateBorder();
        });
    }
}

export default setUpColorInputs;