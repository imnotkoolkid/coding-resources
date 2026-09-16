import {Weapon} from "./Weapons";

export default class GuiManager {
    elements: { [id: string]: HTMLElement | undefined } = {
        weaponSelector: undefined,
        textureDropZone: undefined,
        textureInput: undefined,
        timeSinceLastKillReset: undefined,
        printSelector: undefined,
        playShootAnimButton: undefined,
        shaderSelector: undefined,
        shaderPrevBtn: undefined,
        shaderNextBtn: undefined,
    };

    constructor(
        onModelChange: (weapon: string) => Promise<void>,
        onTextureChange: (texture: string) => void,
        onPrintChange: (print: number) => void,
        onTimeSinceLastKillReset: () => void,
        onPlayShoot: () => void,
        onShaderChange: (shader: string) => Promise<void>,
        initialShader: string
    ) {
        for (let elementId in this.elements) {
            this.elements[elementId] = document.getElementById(elementId);
        }

        const weaponSelector = this.elements.weaponSelector as HTMLSelectElement;

        for (let weaponId in Weapon) {
            if (!isNaN(Number.parseInt(weaponId))) continue;

            const listElement = document.createElement("option");
            listElement.innerText = listElement.value = weaponId;
            weaponSelector.appendChild(listElement);
        }

        const lastUsedWeapon = localStorage.getItem("lastUsedWeapon");
        if (lastUsedWeapon && lastUsedWeapon in Weapon) weaponSelector.value = lastUsedWeapon;

        const onChangeCallback = async () => {
            const value = weaponSelector.value;
            await onModelChange(value);
            localStorage.setItem("lastUsedWeapon", value);
        };

        weaponSelector.addEventListener("change", onChangeCallback);
        onChangeCallback();

        const shaderSelector = this.elements.shaderSelector as HTMLSelectElement;
        const shaderPrevBtn = this.elements.shaderPrevBtn as HTMLButtonElement;
        const shaderNextBtn = this.elements.shaderNextBtn as HTMLButtonElement;

        if (shaderSelector && onShaderChange) {
            const shaders = (import.meta as any).glob('/public/shaders/**/fragment.frag');
            const shaderNames = Object.keys(shaders).map(path => path.replace('/public/shaders/', '').replace('/fragment.frag', ''));

            for (let shaderName of shaderNames) {
                const listElement = document.createElement("option");
                listElement.innerText = listElement.value = shaderName;
                shaderSelector.appendChild(listElement);
            }

            const lastUsedShader = localStorage.getItem("lastUsedShader");
            if (lastUsedShader && shaderNames.includes(lastUsedShader)) {
                shaderSelector.value = lastUsedShader;
                setTimeout(() => onShaderChange(lastUsedShader), 0);
            } else if (initialShader && shaderNames.includes(initialShader)) {
                shaderSelector.value = initialShader;
                setTimeout(() => onShaderChange(initialShader), 0);
            } else if (shaderNames.length > 0) {
                shaderSelector.value = shaderNames[0];
                setTimeout(() => onShaderChange(shaderNames[0]), 0);
            }

            const triggerShaderChange = async () => {
                const value = shaderSelector.value;
                await onShaderChange(value);
                localStorage.setItem("lastUsedShader", value);
            };

            shaderSelector.addEventListener("change", triggerShaderChange);

            const selectShaderByIndex = (index: number) => {
                const count = shaderSelector.options.length;
                if (count === 0) return;
                const newIndex = ((index % count) + count) % count;
                shaderSelector.selectedIndex = newIndex;
                triggerShaderChange();
            };

            if (shaderPrevBtn) {
                shaderPrevBtn.addEventListener("click", () => {
                    selectShaderByIndex(shaderSelector.selectedIndex - 1);
                });
            }

            if (shaderNextBtn) {
                shaderNextBtn.addEventListener("click", () => {
                    selectShaderByIndex(shaderSelector.selectedIndex + 1);
                });
            }
        }

        const textureDropZone = this.elements.textureDropZone as HTMLDivElement;
        const textureInput = this.elements.textureInput as HTMLInputElement;

        // prevent the window from catching the drop instead of the drop zone
        window.addEventListener("drop", (event) => {
            if ([...event.dataTransfer.items].some((item) => item.kind === "file")) {
                event.preventDefault();
            }
        });

        window.addEventListener("dragover", (event) => {
            if (Array.from(event.dataTransfer.items).some((item) => item.kind === "file")) {
                event.preventDefault();
                if (!textureDropZone.contains(event.target as Node)) {
                    event.dataTransfer.dropEffect = "none";
                }
            }
        });

        textureDropZone.addEventListener("dragover", (event) => {
            const items = Array.from(event.dataTransfer.items);
            if (items.some((item) => item.kind === "file")) {
                event.preventDefault();
                event.dataTransfer.dropEffect = items.some((item) => item.type.startsWith("image/")) ? "copy" : "none";
            }
        });

        const fileCallback = (file: File) => {
            const url = URL.createObjectURL(file);
            textureDropZone.style.backgroundImage = `url(${url})`;
            textureDropZone.classList.add("has-image");
            onTextureChange(url);
        };

        textureDropZone.addEventListener("drop", (event) => {
            event.preventDefault();
            const file = Array.from(event.dataTransfer.items).find((item) => item.kind === "file" && item.type.startsWith("image/")).getAsFile();
            fileCallback(file);
        });

        textureInput.addEventListener("change", () => {
            if (textureInput.files[0] && textureInput.files[0].type.startsWith("image/")) {
                fileCallback(textureInput.files[0]);
            }
        });

        const timeSinceLastKillResetButton = this.elements.timeSinceLastKillReset as HTMLButtonElement;

        timeSinceLastKillResetButton.addEventListener("click", () => {
            onTimeSinceLastKillReset();
        });

        const printSelector = this.elements.printSelector as HTMLInputElement;

        printSelector.addEventListener("input", () => {
            const value = Math.floor(parseInt(printSelector.value));
            if (isFinite(value)) {
                onPrintChange(value);
            }
        });


        const playShootAnimButton = this.elements.playShootAnimButton as HTMLButtonElement;
        playShootAnimButton.addEventListener("click", onPlayShoot);

        const bgTypeSelector = document.getElementById("bgTypeSelector") as HTMLSelectElement;
        const bgSolidSettings = document.getElementById("bgSolidSettings") as HTMLDivElement;
        const bgCheckerSettings = document.getElementById("bgCheckerSettings") as HTMLDivElement;
        const bgImageSettings = document.getElementById("bgImageSettings") as HTMLDivElement;

        const bgColorPicker = document.getElementById("bgColorPicker") as HTMLInputElement;
        const bgCheckerColor1 = document.getElementById("bgCheckerColor1") as HTMLInputElement;
        const bgCheckerColor2 = document.getElementById("bgCheckerColor2") as HTMLInputElement;
        const bgImageInput = document.getElementById("bgImageInput") as HTMLInputElement;

        let bgImageObjectURL: string | null = null;

        const updateBackground = () => {
            if (!bgTypeSelector) return;
            const type = bgTypeSelector.value;

            localStorage.setItem("bgType", type);
            if (bgColorPicker) localStorage.setItem("bgColor", bgColorPicker.value);
            if (bgCheckerColor1) localStorage.setItem("bgChecker1", bgCheckerColor1.value);
            if (bgCheckerColor2) localStorage.setItem("bgChecker2", bgCheckerColor2.value);

            if (bgSolidSettings) bgSolidSettings.style.display = type === "solid" ? "flex" : "none";
            if (bgCheckerSettings) bgCheckerSettings.style.display = type === "checker" ? "flex" : "none";
            if (bgImageSettings) bgImageSettings.style.display = type === "image" ? "flex" : "none";

            if (type === "solid") {
                document.body.style.backgroundImage = "none";
                document.body.style.backgroundColor = bgColorPicker ? bgColorPicker.value : "#000000";
            } else if (type === "checker") {
                const c1 = bgCheckerColor1 ? bgCheckerColor1.value : "#6d6d6d";
                const c2 = bgCheckerColor2 ? bgCheckerColor2.value : "#000000";
                document.body.style.backgroundImage = `conic-gradient(${c1} 25%, ${c2} 25% 50%, ${c1} 50% 75%, ${c2} 75%)`;
                document.body.style.backgroundSize = "20px 20px";
            } else if (type === "image") {
                if (bgImageObjectURL) {
                    document.body.style.backgroundImage = `url(${bgImageObjectURL})`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                } else {
                    document.body.style.backgroundImage = "none";
                    document.body.style.backgroundColor = "#000000";
                }
            }
        };

        if (bgTypeSelector) {
            const savedBgType = localStorage.getItem("bgType");
            if (savedBgType) bgTypeSelector.value = savedBgType;
        }
        if (bgColorPicker) {
            const savedBgColor = localStorage.getItem("bgColor");
            if (savedBgColor) bgColorPicker.value = savedBgColor;
        }
        if (bgCheckerColor1) {
            const savedBgChecker1 = localStorage.getItem("bgChecker1");
            if (savedBgChecker1) bgCheckerColor1.value = savedBgChecker1;
        }
        if (bgCheckerColor2) {
            const savedBgChecker2 = localStorage.getItem("bgChecker2");
            if (savedBgChecker2) bgCheckerColor2.value = savedBgChecker2;
        }

        updateBackground();

        if (bgTypeSelector) bgTypeSelector.addEventListener("change", updateBackground);
        if (bgColorPicker) bgColorPicker.addEventListener("input", updateBackground);
        if (bgCheckerColor1) bgCheckerColor1.addEventListener("input", updateBackground);
        if (bgCheckerColor2) bgCheckerColor2.addEventListener("input", updateBackground);

        if (bgImageInput) {
            bgImageInput.addEventListener("change", () => {
                if (bgImageInput.files && bgImageInput.files[0]) {
                    if (bgImageObjectURL) URL.revokeObjectURL(bgImageObjectURL);
                    bgImageObjectURL = URL.createObjectURL(bgImageInput.files[0]);
                    updateBackground();
                }
            });
        }
    }
}
