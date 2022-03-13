async function main() {
  let inputs = await rxjs.firstValueFrom(
    UtopiaApi.getInputsFromUser({
      inputs: [
        {
          label: "Source Block Type",
          name: "sourceBlock",
          type: "blockType",
          hint: "Blocks of this type will turn into a random color block",
          required: true
        },
      ],
      gridDescriptor: {
        rows: [
          ["sourceBlock"],
        ],
        templateColumns: "300px"
      },
    })
  );

  let obs = UtopiaApi.blockPlaced().pipe(
    rxjs.tap((blockPlaceEvent) => {
      if (blockPlaceEvent.type == inputs.sourceBlock) {
        var randomColor = "#000000".replace(/0/g, function () {
          return (~~(Math.random() * 16)).toString(16);
        });
        UtopiaApi.placeBlock(
          randomColor,
          blockPlaceEvent.position.x,
          blockPlaceEvent.position.y,
          blockPlaceEvent.position.z
        ).subscribe();
      }
    }),
  );

  await rxjs.lastValueFrom(obs);
}
