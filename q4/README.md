# Question 4 from the Junior dev '23

## Assumptions
- Can only use a single let statement in the beggining of a prompt, hence only 1 variable can be set in a single prompt.
- Each prompt can only contain a single statement.

## How it works
* ∧ -> means && has higher precedence than ||
* ∨ -> means || has higher precendence than ==
* = -> means ==
* ¬ -> means ! which has highest precendance

When a `let` is used to start a statement, that means we take the second valueas the variable name, then the rest of the commands after the first = sign are what we process and assign the variable we label as the second value. eg:
```
let X = T
```
sets a variable call 'X' with the value of true or 'T'.
When this kind of statement is used, and debug flag is set with `--debug`, then their will be a line print containing the variables currently stored in interpreter just before the normal output saying what the variable was set to, eg for the command above it the normal output would be:
```shell
X: T
```

If the statement passed doesn't contain the `let` keyword, then it is turned to a simple interpretation for javascript, and if the debug flag is turned on, you can see what the statement would look like in normal javascript/typescript form printed in the first line after the prompt.

## Starting the interpreter
To start the interpreter run the following command bellow.

```shell
npm run q4
```
This command is basically the same as running the following commands
bellow.

```shell
tsc && node ./build/q4/q4.js
```
`tsc` here being the local typescript compiler.

## Starting the interpreter in debug
To start the interpreter in debug mode to see more information, then run the command bellow.

```shell
npm run q4_debug
```

which is similar to just running the following command:

```shell
tsc && node ./build/q4/q4.js --debug
```

The extra information printed includes the valuation used when transfered to javascript/typescript format, in the line starting with `eval`.
The next line then contains the variables, if the command inserted ended up
adding a new variable or editing an already existing one.
Then the final line is the normal output as would happen in none-debug mode, which is then followed by a prompt to continue.

## Extra commands
User can type exit on the prompt to exit the program safely.

## Source
The main code of this excersice is located [here](./q4.ts);
