const descriptor = {
    inputs: [
        {
            label: "Wall First Corner",
            name: "firstCorner",
            type: "position",
            required: true,
        },
        {
            label: "Wall Second Corner",
            name: "secondCorner",
            type: "position",
            required: true,
        },
        {
            label: "Create Wall",
            name: "createWall",
            type: "selection",
            defaultValue: "yes",
            required: true,
            options: [
                { key: "yes", value: "yes" },
                { key: "no", value: "no" },
            ],
        },
        {
            label: "Wall Block Type",
            name: "wallBlockType",
            type: "blockType",
            required: true,
            defaultValue: "stone",
        },
        {
            label: "Image Width",
            name: "width",
            type: "number",
            required: true,
            defaultValue: 3,
        },
        {
            label: "Image Height",
            name: "height",
            type: "number",
            required: true,
            defaultValue: 3,
        },
        {
            label: "Horizontal Gap",
            name: "horizontalGap",
            type: "number",
            required: true,
            defaultValue: 2,
        },
        {
            label: "Vertical Gap",
            name: "verticalGap",
            type: "number",
            required: true,
            defaultValue: 1,
        },
        {
            label: "Rows Count",
            name: "rowsCount",
            type: "number",
            required: true,
            defaultValue: 2,
        },
        {
            label: "Columns Count",
            name: "columnsCount",
            type: "number",
            required: true,
            defaultValue: 4,
        },
        {
            label: "NFTs",
            name: "items",
            type: {
                inputs: [
                    {
                        label: "Collection Address",
                        name: "collection",
                        type: "text",
                        required: true,
                        defaultValue:
                            "0xdc0479cc5bba033b3e7de9f178607150b3abce1f",
                    },
                    {
                        label: "Token ID",
                        name: "tokenId",
                        type: "number",
                        required: true,
                        defaultValue: "3380",
                    },
                ],
                gridDescriptor: {
                    rows: [["collection"], ["tokenId"]],
                },
            },
            isList: true,
            required: true,
        },
    ],
    gridDescriptor: {
        rows: [
            ["firstCorner", "secondCorner", "items", "items"],
            ["createWall", "wallBlockType", "items", "items"],
            ["horizontalGap", "verticalGap", "items", "items"],
            ["rowsCount", "columnsCount", "items", "items"],
            ["width", "height", "items", "items"],
        ],
    },
};

async function main() {
    const inputs = await rxjs.firstValueFrom(
        UtopiaApi.getInputsFromUser(descriptor)
    );

    const playerPositionRaw = await rxjs.firstValueFrom(
        UtopiaApi.getPlayerPosition()
    );

    const playerPosition = {
        x: Math.floor(playerPositionRaw.x),
        y: Math.floor(playerPositionRaw.y),
        z: Math.floor(playerPositionRaw.z),
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

    if (firstCorner.x != secondCorner.x && firstCorner.z != secondCorner.z)
        throw new Error("Invalid wall corners");

    const drawAlongX = firstCorner.x != secondCorner.x;

    const wallWidth =
        1 + (drawAlongX
            ? Math.abs(firstCorner.x - secondCorner.x)
            : Math.abs(firstCorner.z - secondCorner.z));
    const wallHeight = Math.abs(firstCorner.y - secondCorner.y) + 1;

    const startingPosition = {
        x: drawAlongX
            ? firstCorner.z >= playerPosition.z
                ? Math.min(firstCorner.x, secondCorner.x)
                : Math.max(firstCorner.x, secondCorner.x)
            : firstCorner.x,
        y: Math.min(firstCorner.y, secondCorner.y),
        z: !drawAlongX
            ? firstCorner.x >= playerPosition.x
                ? Math.max(firstCorner.z, secondCorner.z)
                : Math.min(firstCorner.z, secondCorner.z)
            : firstCorner.z,
    };

    const wallRelativeStartingPosition = {
        x: startingPosition.x - playerPosition.x,
        y: startingPosition.y - playerPosition.y,
        z: startingPosition.z - playerPosition.z,
    };

    const incrementor = (w, y) => {
        return {
            x:
                startingPosition.x +
                (drawAlongX ? w : 0) *
                    (wallRelativeStartingPosition.z >= 0 ? 1 : -1),
            z:
                startingPosition.z +
                (drawAlongX ? 0 : w) *
                    (wallRelativeStartingPosition.x >= 0 ? -1 : 1),
            y: startingPosition.y + y,
        };
    };

    const isMetaCandidate = (w, y) => {
        if (
            (y - inputs.verticalGap) % (inputs.verticalGap + inputs.height) !=
            0
        )
            return false;
        if (
            (drawAlongX && wallRelativeStartingPosition.z >= 0) ||
            (!drawAlongX && wallRelativeStartingPosition.x < 0)
        )
            return (
                (w - inputs.horizontalGap) %
                    (inputs.horizontalGap + inputs.width) ==
                0
            );
        return (w + 1) % (inputs.horizontalGap + inputs.width) == 0;
    };

    const side = drawAlongX
        ? wallRelativeStartingPosition.z >= 0
            ? "back"
            : "front"
        : wallRelativeStartingPosition.x >= 0
        ? "left"
        : "right";

    const nftWallData = [];

    let usedRowsCount = 0;
    for (let y = 0; y < wallHeight; y++) {
        console.log("outer loop");
        let usedColumnsCount = 0;
        for (let w = 0; w < wallWidth; w++) {
            console.log("inner loop");
            const pos = incrementor(w, y);

            let metaBlock = null;
            if (
                usedColumnsCount < inputs.columnsCount &&
                usedRowsCount < inputs.rowsCount &&
                isMetaCandidate(w, y) &&
                inputs.items != null &&
                inputs.items.length > 0
            ) {
                usedColumnsCount += 1;
                metaBlock = {
                    type: "nft",
                    properties: {},
                };

                const nft = inputs.items.splice(0, 1)[0];
                metaBlock.properties[side] = {
                    collection: nft.collection,
                    tokenId: nft.tokenId,
                    width: inputs.width,
                    height: inputs.height,
                };
            }

            const blockType =
                inputs.createWall == "yes" ? inputs.wallBlockType : null;

            if (metaBlock != null || blockType != null)
                nftWallData.push({
                    position: pos,
                    type: {
                        blockType,
                        metaBlock,
                    },
                });
        }
        if (usedColumnsCount > 0) {
            usedRowsCount += 1;
        }
    }

    const result = await rxjs.firstValueFrom(
        UtopiaApi.placeBlocks(nftWallData)
    );
    console.log(JSON.stringify(result));

    if (inputs.items.length > 0) {
        console.warn(
            `Could not place ${inputs.items.length} images. Choose wall corners carefully`
        );
    }
}
