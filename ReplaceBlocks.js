const descriptor = {
    inputs: [
        {
            label: "Block Type At Position",
            name: "position",
            type: "position",
            required: true,
        },
        {
            label: "ًReplace With",
            name: "blockType",
            type: "blockType",
            required: true,
            defaultValue: "stone",
        },
        {
            label: "First Corner",
            name: "firstCorner",
            type: "position",
            required: true,
        },
        {
            label: "Second Corner",
            name: "secondCorner",
            type: "position",
            required: true,
        },
    ],
    gridDescriptor: {
        rows: [
            ["position"], 
            ["blockType"],
            ["firstCorner", "secondCorner"],
        ],
    },
};

async function main() {
    const inputs = await rxjs.firstValueFrom(
        UtopiaApi.getInputsFromUser(descriptor)
    );

    const from = {
        x: 0,
        y: 0,
        z: 0,
    };

    const to = {
        x: 0,
        y: 0,
        z: 0,
    };

    const firstCorner = {
        x: Math.floor(inputs.firstCorner.x),
        y: Math.floor(inputs.firstCorner.y),
        z: Math.floor(inputs.firstCorner.z),
    };

    const secondCorner = {
        x: Math.floor(inputs.secondCorner.x),
        y: Math.floor(inputs.secondCorner.y),
        z: Math.floor(inputs.secondCorner.z),
    };

    if (inputs.firstCorner.x < secondCorner.x) {
        from.x = firstCorner.x;
        to.x = secondCorner.x;
    } else {
        to.x = firstCorner.x;
        from.x = secondCorner.x;
    }

    if (firstCorner.y < secondCorner.y) {
        from.y = firstCorner.y;
        to.y = secondCorner.y;
    } else {
        to.y = firstCorner.y;
        from.y = secondCorner.y;
    }

    if (firstCorner.z < secondCorner.z) {
        from.z = firstCorner.z;
        to.z = secondCorner.z;
    } else {
        to.z = firstCorner.z;
        from.z = secondCorner.z;
    }

    const blocks = [];

    const targetBlockType = await rxjs.firstValueFrom(
        UtopiaApi.getBlockTypeAt(inputs.position)
    );

    console.log("targetBlockType", targetBlockType);

    for (let y = from.y; y <= to.y; y++)
        for (let x = from.x; x <= to.x; x++)
            for (let z = from.z; z <= to.z; z++) {
                const blockType = await rxjs.firstValueFrom(
                    UtopiaApi.getBlockTypeAt({ x, y, z })
                );
                if (blockType == targetBlockType) {
                    blocks.push({
                        position: { x, y, z },
                        type: {
                            blockType: inputs.blockType,
                        },
                    });
                }
            }

    const result = await rxjs.firstValueFrom(UtopiaApi.placeBlocks(blocks));
    console.log(JSON.stringify(result));
}
