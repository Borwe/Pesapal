const TOTAL_RAM = 64*1024;

let RAM = new Uint8Array(TOTAL_RAM);



let R1 = 0;
let R2 = 0;
let R3 = 0;
let PC = 0;
let COND = 0;

function print_state_of_registers(){
    console.log("------------");
    console.log("R1:",R1);
    console.log("R2:",R2);
    console.log("R3:",R3);
    console.log("PC:",PC);
    console.log("COND:",COND);
    console.log("------------");
}

function main(){
    console.log("RAM IS",RAM.byteLength,"bytes");

    if(process.argv.length < 3){
        console.error("Error: Only passed",process.argv.length,"args");
        console.error("Usage: node ./build/p2.js <binary_file> [--debug]");
        return;
    }

    console.log(process.argv)
}

main();
