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
    {
        label: "Total Voxels Limit",
        name: "voxelsCountLimit",
        type: "number",
        required: true,
        defaultValue: 1000,
    },
];

function getDetails(voxels) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;

    const uniqueColorIndices = [];

    for (const voxel of voxels) {
        minX = voxel.x < minX ? voxel.x : minX;
        minY = voxel.y < minY ? voxel.y : minY;
        minZ = voxel.z < minZ ? voxel.z : minZ;

        if (uniqueColorIndices.indexOf(voxel.c) == -1)
            uniqueColorIndices.push(voxel.c);
    }
    return {
        min: { x: minX, y: minY, z: minZ },
        uniqueColorIndices: uniqueColorIndices,
    };
}

async function main() {
    const inputs = await UtopiaApi.getInputsFromUser(baseParams);
    importScripts(inputs.parserUrl);
    const buffer = await (
        await fetch(new Request(inputs.voxUrl))
    ).arrayBuffer();
    const data = vox.parseMagicaVoxel(buffer);

    if (data.XYZI.length > inputs.voxelsCountLimit) {
        throw new Error(
            `Model has a total of ${data.XYZI.length} voxels which is more than the allowed number of voxels (${inputs.voxelsCountLimit})`
        );
    }

    const pos = inputs.startingPosition;
    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    const colors = data.RGBA;
    const details = getDetails(data.XYZI);

    const middleExecutionInputs = [];
    for (const index of details.uniqueColorIndices) {
        const color = colors[index];
        middleExecutionInputs.push({
            label: `<div style="width:20px; height:20px; background:rgba(${color.r},${color.g},${color.b},${color.a}); border:1px solid black;"></div>`,
            name: "bt" + index,
            type: "blockType",
            required: true,
        });
    }
    const blockTypeInputs = await UtopiaApi.getInputsFromUser(
        middleExecutionInputs
    );

    for (const voxel of data.XYZI) {
        const xx = x + voxel.x - details.min.x;
        const yy = y + voxel.z - details.min.z;
        const zz = z + voxel.y - details.min.y;

        let res;
        try {
            res = await UtopiaApi.placeBlock(
                blockTypeInputs["bt" + voxel.c],
                xx,
                yy,
                zz
            );
        } catch (e) {
            console.error(
                "Place block failed at " +
                    xx +
                    ", " +
                    yy +
                    ", " +
                    zz +
                    ": " +
                    res
            );
        }
    }
}
