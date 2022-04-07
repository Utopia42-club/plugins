const descriptor = {
    inputs: [
        {
            label: "Starting Position",
            name: "startingPosition",
            type: "position",
            required: true,
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
                    rows: [["collection", "tokenId"]],
                },
            },
            isList: true,
            required: true,
        },
    ],
    gridDescriptor: {
        rows: [
            ["startingPosition", "wallBlockType", "items", "items"],
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

    const playerPosition = await rxjs.firstValueFrom(
        UtopiaApi.getPlayerPosition()
    );

    const startingPosition = {
        x: Math.floor(inputs.startingPosition.x),
        y: Math.floor(inputs.startingPosition.y),
        z: Math.floor(inputs.startingPosition.z),
    };

    const wallRelativeStartingPosition = {
        x: startingPosition.x - Math.floor(playerPosition.x),
        y: startingPosition.y - Math.floor(playerPosition.y),
        z: startingPosition.z - Math.floor(playerPosition.z)
    };

    const start = {
        x: startingPosition.x,
        y: startingPosition.y,
        z: startingPosition.z,
    };

    const wallWidth =
        (inputs.columnsCount + 1) * inputs.horizontalGap +
        inputs.columnsCount * inputs.width;
    const wallHeight =
        (inputs.rowsCount + 1) * inputs.verticalGap +
        inputs.rowsCount * inputs.height;

    const drawAlongX =
        Math.abs(wallRelativeStartingPosition.x) <
        Math.abs(wallRelativeStartingPosition.z);

    const incrementor = (w, y) => {
        return {
            x:
                start.x +
                (drawAlongX ? w : 0) *
                (wallRelativeStartingPosition.z >= 0 ? 1 : -1),
            z:
                start.z +
                (drawAlongX ? 0 : w) *
                (wallRelativeStartingPosition.x >= 0 ? -1 : 1),
            y: start.y + y,
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

    for (let y = wallHeight - 1; y >= 0; y--)
        for (let w = 0; w < wallWidth; w++) {
            const pos = incrementor(w, y);

            let metaBlock = null;
            if (isMetaCandidate(w, y) && inputs.items != null && inputs.items.length > 0) {
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

            nftWallData.push({
                position: pos,
                type: {
                    blockType: inputs.wallBlockType,
                    metaBlock: metaBlock,
                },
            });
        }

    const result = await rxjs.firstValueFrom(
        UtopiaApi.placeBlocks(nftWallData)
    );
    console.log(JSON.stringify(result));
}
