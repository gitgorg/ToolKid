interface ToolKid_file { DOM: TK_DOMAnimations_file }

type TK_DOMAnimations_file = {
    smove(inputs: {
        element: HTMLElement,
        targetParent: HTMLElement,
        targetIndex?: number,
        duration: number,
        delay?: number,
        zIndex?: number,
    }): void,
}

interface NodeRequire {
    (path: "TK_DOMAnimations.js"): TK_DOMAnimations_file
}



(function TK_DOMAnimations_init() {
    if (typeof Element === "undefined") {
        return;
    }



    const publicExports = module.exports = <TK_DOMAnimations_file>{};

    const addFrameHandler = function TK_DOMAnimations_addFrameHandler(funk: GenericFunction) {
        frameHandlers[frameHandlerCount] = funk;
        frameHandlerCount += 1;
        if (frameHandlerCount === 1) {
            requestAnimationFrame(handleFrameStart);
        }
    };

    let frameHandlerCount = 0;
    let frameHandlers = new Array(100) as GenericFunction[];
    let frameHandlersAlteration = new Array(100) as GenericFunction[];
    let frameReaderCount = 0;
    const frameReaders = new Array(100) as GenericFunction[];
    const handleFrameStart = function TK_DOMAnimations_handleFrameStart() {
        // operations that force DOM reflow (rendering)
        for (let i = 0; i < frameReaderCount; i += 1) {
            frameReaders[i]();
            frameReaders[i] = <any>undefined;
        }
        frameReaderCount = 0;
        if (frameHandlerCount === 0) {
            return;
        }

         // other operations this frame - switching "active" frameHandlers
        const length = frameHandlerCount;
        const handlers = frameHandlers;
        frameHandlers = frameHandlersAlteration;
        frameHandlerCount = 0;
        for (let i = 0; i < length; i += 1) {
            handlers[i]();
            handlers[i] = <any>undefined;
        }
        frameHandlersAlteration = handlers;
    };



    publicExports.smove = function TK_DOMAnimations_smove(inputs) {
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

        frameReaders[frameReaderCount] = smoveRead.bind(null, inputs, placeholder);
        frameReaderCount += 1;
        if (frameReaderCount === 1) {
            addFrameHandler(smoveSwap);
        }
    };

    const smoveRead = function TK_DOMAnimations_smoveRead(
        internals: Parameters<TK_DOMAnimations_file["smove"]>[0],
        placeholder: HTMLElement
    ) {
        animatedSwitch[animatedSwitchCount] = [
            internals, placeholder,
            internals.element.getBoundingClientRect(),
            placeholder.getBoundingClientRect()
        ];
        animatedSwitchCount += 1;
    };

    let animatedSwitchCount = 0;
    const animatedSwitch = new Array(100) as [
        inputs: Parameters<TK_DOMAnimations_file["smove"]>[0],
        placeholder: HTMLElement,
        elementBCR: Dictionary,
        placeholderBCR: Dictionary,
    ][];
    const smoveSwap = function TK_DOMAnimations_smoveSwap() {
        let element: HTMLElement, elementBCR: Dictionary,
            placeholder: HTMLElement, placeholderBCR: Dictionary,
            inputs: Parameters<TK_DOMAnimations_file["smove"]>[0];
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
        animatedSwitchCount = 0;
        addFrameHandler(smoveAnimate);
    };

    const animatedActive = [] as any[];
    const smoveAnimate = function TK_DOMAnimations_smoveAnimate() {
        let element: HTMLElement,
            placeholder: HTMLElement,
            data: any;
        const length = animatedActive.length;
        for (let i = 0; i < length; i += 1) {
            data = animatedActive[i];
            const inputs = data[0];
            element = inputs.element;
            placeholder = data[1];
            const styleP = placeholder.style;
            styleP.margin = (data[2].height / -2) + "px "
                + (data[2].width / -2) + "px ";
            placeholder.classList.add("--animated");

            const styleE = element.style;
            const duration = (inputs.duration || 1) + "s";
            styleP.setProperty("--animationDuration", duration);
            styleE.setProperty("--animationDuration", duration);

            const delay = (inputs.delay || 0) + "s";
            styleP.setProperty("--animationDelay", delay);
            styleE.setProperty("--animationDelay", delay);

            if (inputs.zIndex !== undefined) {
                styleP.setProperty("--animationZ", inputs.zIndex);
                styleE.setProperty("--animationZ", inputs.zIndex);
            }
            element.classList.add("--animated");
            styleE.margin = "";
            delete (<Dictionary>element)._animationTarget;
            setTimeout(smoveCleanUp.bind(null,
                element, placeholder),
                (inputs.duration || 1 + delay) * 1000
            );
        }
        animatedActive.length = 0;
    };

    const smoveCleanUp = function TK_DOMAnimations_smoveCleanUp(
        element: HTMLElement, placeholder: HTMLElement
    ) {
        element.classList.remove("--animated");
        placeholder.remove();
    };



    const style = document.createElement("style");
    style.textContent = `
        .--animated {
            transition-property: margin;
            transition-duration: var(--animationDuration);
            transition-delay: var(--animationDelay);
            z-index: var(--animationZ);
        }`;
    document.head.appendChild(style);



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "DOM", entries: publicExports });
    }
})();