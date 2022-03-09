var baseInputs = [
  {
    label: "A",
    name: "a",
    type: "position",
    required: true,
  },
  {
    label: "B",
    name: "b",
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

async function main() {
  
  console.log("Running Cube Builder");
  
  var Inputs = await rxjs.firstValueFrom(UtopiaApi.getInputsFromUser({inputs: baseInputs}));

  var startX = Math.min(Inputs.a.x, Inputs.b.x);
  var startY = Math.min(Inputs.a.y, Inputs.b.y);
  var startZ = Math.min(Inputs.a.z, Inputs.b.z);
  var endX = Math.max(Inputs.a.x, Inputs.b.x);
  var endY = Math.max(Inputs.a.y, Inputs.b.y);
  var endZ = Math.max(Inputs.a.z, Inputs.b.z);

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      for (let z = startZ; z <= endZ; z++) {
        if (
          (x != endX || y != endY || z != endZ) &&
          (x != startX || y != startY || z != startZ)
        )
        await rxjs.firstValueFrom(UtopiaApi.placeBlock(Inputs.blockType, x, y, z));
      }
    }
  }
}
