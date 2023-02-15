# Question 0 from the Junior dev '23

## Assumptions from this excersise.
- Registers can not store data beyond 0xFFFF since instructions like `sw` will lead to undefined behaviour in a system that only has a RAM 64K.
- Writing program memory which starts at 0xCFFF is legal, even though it might lead to the execution of code that might not really have been expected by the user.
- User can only use/write directly to `R1`, `R2`, `R3` registers, and any attempt to go past those eg: using R4, should result in an error at runtime.

## How producing the bytecode works.
This is a typescript project, so we would need to compile it, by running:

```shell
npm run build
```

It would output the executable javascript bundle in the `./build` folder where they can be run from using nodejs

To produce the byte code one needs to run the following code:
```shell
node ./build/q0p1.js ./assembly.s ./output.bin
```

the `./assembly.s` file here being the file that contains the instructions
to be turned to byte code, and the `./output.bin` is where the bytes should be written to.

The code for the assembler is located [here](./q0p1.ts)

### Structure of production.
- We first read the `assembly.s` line for line and mark which labels should appear after what instruction.
- Then we re-read the file line by line, handling all the instruction sets, producing bytes to be written on the file taking the labels to account.
- The bytes once read per line an formed into a 16bit byte array are then written to the outputfile, after which we go to the next line, and repeat.
- lines starting with ';' are ignored.
- This process keeps going on until we reach the end of the file `assembly.s` file.


## How running the bytecode in virtual machine.
This is a typescript project, so we would need to compile it, by running:

```shell
npm run build
```

this would output the javasscript code that can be run from nodejs in the build folder.

To run the virtual machine use the following commands
```shell
node ./build/q0p2.js ./output.bin --debug
```

The `--debug` option is there if you want to go throw the program insruction by instruction while viewing the data, in the registers.

Once the virtual machine is done running, either due to an error or because it has reached the end or an `halt` instruction set, it would print out the final state of registers irregardless of if you have the `--debug` option set.

### NOTE:
- The PC register shows the location in memory which the instruction set being executed is at.
- Saw no use for COND register as no instruction really seemed to require it's use

## Discovery when doing this question

- At first I thought running the assembly from part2 of the question was buggy, but on second look it came to my attention that it stops not because there was a bug, but because at some point the instruction `sw R1 R1` started overiting the program memory which begins at 0xCFFF, changing and halting the program at PC 0xd008.
