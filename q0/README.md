# Question 0 from the Junior dev '23

## Assumptions from this excersise.
- Registers can not store data beyond 0xFFFF since instructions like `sw` will lead to undefined behaviour in a system that only has a RAM 64K.
- Writing program memory which starts at 0xCFFF is legal, even though it might lead to the execution of code that might not really have been expected by the user.
- User can only use/write directly to `R1`, `R2`, `R3` registers, and any attempt to go past those eg: using R4, should result in an error at runtime.

## How producing the bytecode works.
This is a typescript project, so we would need to compile it, by running:

```shell
npx tsc
```

or use your local typescript compiler, it would output the executable javascript bundle in the `./build` folder where they can be run from using nodejs

To produce the byte code one needs to run the following code:
```shell
node ./build/q0p1.js ./assembly.s ./output.bin
```

the `./assembly.s` file here being the file that contains the instructions
to be turned to byte code, and the `./output.bin` is where the bytes should be written to.

The code for the assembler is located [here](./q0/q0p1.ts)
