const saveByteArray = (data: Int8Array, name: string) => {
    const el = document.createElement("a");
    document.body.appendChild(el);

    const blob = new File([data], name, {type: "octet/stream"});
    const url = URL.createObjectURL(blob);

    el.setAttribute("href", url);
    el.setAttribute("download", name);

    el.click();
    el.remove();

    URL.revokeObjectURL(url);
};

export {saveByteArray}
