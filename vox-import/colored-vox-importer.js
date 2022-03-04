const baseParams = [
    {
        label: "Parser Script URL",
        name: "parserUrl",
        type: "text",
        required: true,
        defaultValue:
            "https://cdn.jsdelivr.net/gh/Utopia42-club/plugins@1adc37a0d3c00d008856753e921419fe923f5701/vox-import/parser-lib.js",
    },
    {
        label: "Voxel File URL",
        name: "voxUrl",
        type: "text",
        required: true,
        defaultValue:
            "https://cdn.jsdelivr.net/gh/ephtracy/voxel-model@master/vox/character/chr_mom.vox",
    },
    {
        label: "Starting Position",
        name: "startingPosition",
        type: "position",
        required: true,
    },
];

const getHexStr = (x) => {
    if (x < 10) return x.toString();
    if (x == 10) return "a";
    if (x == 11) return "b";
    if (x == 12) return "c";
    if (x == 13) return "d";
    if (x == 14) return "e";
    if (x == 15) return "f";
};

const intToHex = (x) => {
    return `${getHexStr(Math.floor(x / 16))}${getHexStr(x % 16)}`;
};

function getDetails(voxels) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;

    for (const voxel of voxels) {
        minX = voxel.x < minX ? voxel.x : minX;
        minY = voxel.y < minY ? voxel.y : minY;
        minZ = voxel.z < minZ ? voxel.z : minZ;
    }
    return {
        min: { x: minX, y: minY, z: minZ },
    };
}

async function main() {
    const inputs = await UtopiaApi.getInputsFromUser(baseParams);
    importScripts(inputs.parserUrl);
    const buffer = await (
        await fetch(new Request(inputs.voxUrl))
    ).arrayBuffer();
    const data = vox.parseMagicaVoxel(buffer);

    const pos = inputs.startingPosition;
    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    const colors = data.RGBA.map((color) => {
        return "#" + [color.r, color.g, color.b].map(intToHex).join("");
    });
    const details = getDetails(data.XYZI);

    const reqs = [];

    for (const voxel of data.XYZI) {
        const xx = x + voxel.x - details.min.x;
        const yy = y + voxel.z - details.min.z;
        const zz = z + voxel.y - details.min.y;

        reqs.push({
            type: colors[voxel.c],
            position: {
                x: xx,
                y: yy,
                z: zz,
            },
        });
    }

    const res = await UtopiaApi.placeBlocks(reqs);
    const failed = [];
    let success = 0;
    for (const position of Object.keys(res)) {
        if (res[position]) success++;
        else failed.push(position);
    }
    console.log(`Placed ${success} out of ${Object.keys(res).length} blocks.`);
    if (failed.length > 0)
        console.warn("Failed to place block at following positions", failed);
}
