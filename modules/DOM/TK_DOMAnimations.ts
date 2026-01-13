interface ToolKid_file { DOM: TK_DOMAnimations_file }

type TK_DOMAnimations_file = {
    moveSmooth(inputs: {
        element: HTMLElement,
        targetParent: HTMLElement,
        duration: number,

        targetIndex?: number,
    }): void,
}



(function TK_DOMAnimations_init() {
    if (typeof Element === "undefined") {
        return;
    }



    const publicExports = module.exports = <TK_DOMAnimations_file>{};

    publicExports.moveSmooth = function RS_h_DOM_moveSmooth(inputs) {
        if ((<Dictionary>inputs.element)._animationTarget === inputs.targetParent) {
            return;
        }

        (<Dictionary>inputs.element)._animationTarget = inputs.targetParent;
        const placeholder = document.createElement("div");
        placeholder.style.opacity = "0";
        placeholder.style.pointerEvents = "none";

        const siblings = inputs.targetParent.children;
        inputs.targetParent.insertBefore(
            placeholder,
            siblings[inputs.targetIndex || siblings.length]
        );

        if (count2 === 0) {
            requestAnimationFrame(moveSmoothRead);
        }
        step2[count2] = [inputs, placeholder];
        count2 += 1;
    };

    const step2 = new Array(100) as any[];
    let count2 = 0;
    const moveSmoothRead = function () {
        let element: HTMLElement, elementBCR: Dictionary,
            placeholder: HTMLElement, placeholderBCR: Dictionary,
            inputs: Parameters<TK_DOMAnimations_file["moveSmooth"]>[0];
        for (let i = 0; i < count2; i += 1) {
            inputs = step2[i][0];
            element = inputs.element;
            elementBCR = element.getBoundingClientRect();
            placeholder = step2[i][1];
            placeholderBCR = placeholder.getBoundingClientRect();

            animatedSwitch[i] = [inputs, placeholder, elementBCR, placeholderBCR];
            animatedSwitchCount += 1;
        }
        animatedSwitchCount = count2;
        count2 = 0;
        requestAnimationFrame(moveSmoothSwap);
    };

    const animatedSwitch = [] as [
        inputs: Parameters<TK_DOMAnimations_file["moveSmooth"]>[0],
        placeholder: HTMLElement,
        elementBCR: Dictionary,
        placeholderBCR: Dictionary,
    ][];
    let animatedSwitchCount = 0;
    const moveSmoothSwap = function () {
        let element: HTMLElement, elementBCR: Dictionary,
            placeholder: HTMLElement, placeholderBCR: Dictionary,
            inputs: Parameters<TK_DOMAnimations_file["moveSmooth"]>[0];
        for (let i = 0; i < animatedSwitchCount; i += 1) {
            inputs = animatedSwitch[i][0];
            element = inputs.element;
            elementBCR = animatedSwitch[i][2];
            placeholder = animatedSwitch[i][1];
            placeholderBCR = animatedSwitch[i][3];

            const styleP = placeholder.style;
            placeholder.className = element.className;
            styleP.width = elementBCR.width + "px";
            styleP.height = elementBCR.height + "px";

            (<HTMLElement>element.parentElement).insertBefore(placeholder, element);

            const styleE = element.style;
            const diffY = elementBCR.top - placeholderBCR.top;
            const diffX = elementBCR.left - placeholderBCR.left;
            styleE.margin =
                diffY + "px "
                + (-diffX - elementBCR.width) + "px "
                + (-diffY - elementBCR.height) + "px "
                + diffX + "px";
            const siblings = inputs.targetParent.children;
            inputs.targetParent.insertBefore(
                element,
                siblings[inputs.targetIndex || siblings.length + 1]
            );
            delete (<Dictionary>element)._animationTarget;
            animatedActive[i] = [inputs, placeholder, elementBCR];
        }
        animatedSwitch.length = 0;
        requestAnimationFrame(moveSmoothAnimate);
    };

    const animatedActive = [] as any[];
    const moveSmoothAnimate = function () {
        let element: HTMLElement,
            placeholder: HTMLElement,
            inputs: any;
        const length = animatedActive.length;
        for (let i = 0; i < length; i += 1) {
            inputs = animatedActive[i];
            element = inputs[0].element;
            placeholder = inputs[1];
            const styleP = placeholder.style;
            styleP.margin = (inputs[2].height / -2) + "px "
            + (inputs[2].width / -2) + "px ";
            const duration = (inputs[0].duration || 1) + "s";
            styleP.setProperty("--animationDuration",duration);
            placeholder.classList.add("--animated");
            
            const styleE = element.style;
            styleE.setProperty("--animationDuration",duration);
            element.classList.add("--animated");
            styleE.margin = "";
            delete (<Dictionary>element)._animationTarget;
        }
        animatedActive.length = 0;
    };


    const style = document.createElement("style");
        style.textContent =`
.--animated {
    transition-property: margin;
    transition-duration: var(--animationDuration);
}`;
    document.head.appendChild(style);



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "DOM", entries: publicExports });
    }
})();