const imageModules = import.meta.glob ('../img/sanpham/*.{png,jpg,jpeg,webp,gif,svg}', {
    eager : true
});

const baseName = (path) => {
    const name = path.split(/[/\\]/).pop() || "";
    return name.replace(/\.[^.]+$/, '');
};

export const imageMap = Object.fromEntries(
    Object.entries(imageModules).map
        (([path, mod]) => [baseName(path), mod.default])
);

console.log("Productimage imageMap keys:", Object.keys(imageMap));
console.log("Productimage imageMap object:", imageMap);


export function resolveProductImage
    (imageKey) {
    if (imageKey == null || imageKey === '')
        return undefined;
    return imageMap[imageKey];
}
