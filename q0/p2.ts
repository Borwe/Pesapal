import fs from "fs";

/** Hold opcodes with their mnemonics */
const op_codes = new Map<number,string>([[0x0,"halt"], [0x1,"nop"],
    [0x2,"li"],[0x3,"lw"],[0x4,"sw"], [0x5,"add"], [0x6,"sub"],
    [0x7,"mult"],[0x8,"div"],[0x9,"j"],[0xA,"jr"],[0xB,"beq"],
    [0xC,"bne"],[0xD,"inc"],[0xE,"dec"]]);

const TOTAL_RAM = 64*1024;
let DEBUG = false;

let RAM = new Uint8Array(TOTAL_RAM);
const PROG_SECTION = 0xCFFF;
let END_PROG_SECTION = 0xCFFF;

let REGISTERS: Uint16Array[] = [new Uint16Array([0x00,0x00]),
    new Uint16Array([0x00,0x00]),new Uint16Array([0x00,0x00]) ]; 
let PC = 0;
let COND = 0;

// Used to pass byte position by reference
// to functions
type BytePosition = {
    byte_position: number;
}

function print_state_of_registers(point: string){
    debug_print([point]);
    debug_print(["------------"]);
    debug_print(["R1: 0x"+REGISTERS[0][0].toString(16)
        +REGISTERS[0][1].toString(16)]);
    debug_print(["R2: 0x"+REGISTERS[1][0].toString(16)
        +REGISTERS[1][1].toString(16)]);
    debug_print(["R3: 0x"+REGISTERS[2][0].toString(16)
        +REGISTERS[2][1].toString(16)]);
    debug_print(["PC: 0x"+PC.toString(16)]);
    debug_print(["COND: 0x"+COND.toString(16)]);
    debug_print(["------------"]);
}

function wait_enter_input(){
    if(DEBUG==true){
        console.log("Press [enter] to resume");
        let buf = new Buffer(8);
        let fd: number = process.stdin.fd;
        try{
            fd = fs.openSync('/dev/stdin',"rs");
        }catch(e){}
        fs.readSync(fd,buf,0,8,null);
    }
}

function debug_print(lines:any[]) {
    if(DEBUG==true){
        lines.forEach((l)=>{
            console.log(l);
        })
    }
}

function load_program_to_ram(){
    debug_print(["Loading program into RAM section: "+PROG_SECTION]);
    let buff = fs.readFileSync(process.argv[2]);
    let write_buff_from_loc = PROG_SECTION;
    let buff_offset = 0;
    while(buff_offset < buff.byteLength){

        //handle crashing if program to large to fit in program section
        if(write_buff_from_loc > TOTAL_RAM){
            console.error("Program to large to write into RAM from section",PROG_SECTION.toString(16));
            process.exit(-1);
        }

        let u8 = buff.readUint8(buff_offset);
        RAM[write_buff_from_loc] = u8;
        //move to next byte
        ++buff_offset;
        ++write_buff_from_loc;

        //hold end of program section, 
        //to know where the end of the program is
        //on load
        END_PROG_SECTION = write_buff_from_loc;
    }
    debug_print(["Done loading program into RAM"]);
}

function handle_bytes_li(byte_position: BytePosition){
    let u8 = RAM[byte_position.byte_position];
    let register = (u8 & 0xF0) >> 4;
    if(register > 3){
        console.error("Error, register",register,"not a valid register");
        process.exit(-1);
    }

    //read the next bytes
    const byte1 = RAM[++(byte_position.byte_position)];
    const byte2 = RAM[++(byte_position.byte_position)];
    let data = new Uint16Array([byte1,byte2]);
    debug_print(["li R"+register+" 0x"+byte1.toString(16)+byte2.toString(16)]);
    //set the register to the data read
    REGISTERS[register-1] = data;
}

function handle_bytes_lw(byte_position: BytePosition){
}

function handle_instruction(byte_position: BytePosition){
    print_state_of_registers("--BEFORE--");
    //this is the 8 bits that normally contains the instruction type
    let u8 = RAM[byte_position.byte_position];
    let instruction = u8 & 0x0F;

    switch(op_codes.get(instruction)){
        case "halt": process.exit(0);
        case "nop": byte_position.byte_position+=1; break;
        case "li": handle_bytes_li(byte_position);break;
        case "lw": handle_bytes_lw(byte_position);break;
        default: {
            console.error("Instruction set of: 0x"
                +instruction.toString(16)+" not found, exiting.");
            process.exit(-1);
        }
    }

    print_state_of_registers("--AFTER--");

    wait_enter_input();
}

function execute_program(){
    debug_print(["Starting execution"]);
    let byte_position: BytePosition = {
        byte_position: PROG_SECTION
    };
    while(byte_position.byte_position < END_PROG_SECTION){
        handle_instruction(byte_position);
        ++(byte_position.byte_position);
    }
}

function main(){
    console.log("Booting up VM");
    console.log("RAM IS",RAM.byteLength,"bytes");

    if(process.argv.length < 3){
        console.error("Error: Only passed",process.argv.length,"args");
        console.error("Usage: node ./build/p2.js <binary_file> [-- [--debug]]");
        return;
    }

    if(process.argv.length == 4){
        const dbg = process.argv[3];
        if(dbg=="--debug"){
            console.log("Debug mode is turned on, press any key",
                "to move through instructions");
            DEBUG=true;
        }
    }

    load_program_to_ram();
    execute_program();
}

main();
