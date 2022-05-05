const baseInputs = [
    {
        label: "Base Matrix",
        name: "matrix",
        type: "text",
        required: true,
    },
    {
        label: "Height",
        name: "height",
        type: "number",
        required: true,
    },
    {
        label: "Starting Point",
        name: "zero",
        type: "position",
        required: true,
    },
    {
        label: "Block Type",
        name: "blockType",
        type: "blockType",
        required: true,
    },
];

function parse2DMatrix(flattenMatrix) {
    flattenMatrix = flattenMatrix.replace(/\s*/gm, "");
    const matrix2D = flattenMatrix.split(",");
    return matrix2D;
}

async function main() {
    console.log("Running Maze Builder");
    const Inputs = await rxjs.firstValueFrom(
        UtopiaApi.getInputsFromUser({ inputs: baseInputs })
    );
    const matrix = Inputs.matrix;
    const height = Inputs.height;
    const zero = {
        x: Math.floor(Inputs.zero.x),
        y: Math.floor(Inputs.zero.y),
        z: Math.floor(Inputs.zero.z),
    };

    const matrix2D = parse2DMatrix(matrix);
    const mazeData = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < matrix2D[0].length; x++) {
            for (let z = 0; z < matrix2D.length; z++) {
                const char = matrix2D[z][x];
                if (char != "1" && char != "0") {
                    if (char != "*")
                        console.warn(`unrecognized character: ${char}`);
                    continue;
                }
                mazeData.push({
                    position: {
                        x: zero.x + x,
                        y: zero.y + y,
                        z: zero.z + z,
                    },
                    type: {
                        blockType: char == "1" ? Inputs.blockType : "air",
                    },
                });
            }
        }
    }

    const result = await rxjs.firstValueFrom(UtopiaApi.placeBlocks(mazeData));
    console.log(JSON.stringify(result));
}
