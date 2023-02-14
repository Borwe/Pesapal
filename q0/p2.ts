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

let REGISTERS: number[] = [0,0,0];
let PC: number = PROG_SECTION;
/// 0x1 means true 0x0 means false
let COND: number = 0x0;

// Used to pass byte position by reference
// to functions
type BytePosition = {
    byte_position: number;
}

function print_state_of_registers(point: string){
    debug_print([point]);
    debug_print(["------------"]);
    debug_print(["R1: 0x"+REGISTERS[0].toString(16)]);
    debug_print(["R2: 0x"+REGISTERS[1].toString(16)]);
    debug_print(["R3: 0x"+REGISTERS[2].toString(16)]);
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

function handle_bytes_nop(byte_position: BytePosition){
    //increment byte_position
    byte_position.byte_position+=1;
    debug_print(["nop"]);
    //set PC register
    PC += 2;
}

function handle_bytes_li(byte_position: BytePosition){
    let u8 = RAM[byte_position.byte_position];
    let register = ((u8 & 0xF0) >> 4)-1;
    if(register > 2 || register < 0){
        console.error("Error, R"+register,"not a valid register");
        process.exit(-1);
    }

    //read the next bytes
    const byte1 = RAM[++(byte_position.byte_position)];
    const byte2 = RAM[++(byte_position.byte_position)];
    let data = byte1 << 8 | byte2;
    debug_print(["li R"+(register+1)+
        " 0x"+data.toString(16)]);

    //set the register to the data read
    REGISTERS[register] = data;
    PC += 3;
}


function handle_bytes_sw(byte_position: BytePosition){
    let r_1 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;
    let r_2 = (RAM[++(byte_position.byte_position)]) -1


    if(r_1 > 2 || r_1 < 0 || r_2 > 2 || r_2 < 0){
        console.log("Error, general register can only be  R1 R2 R3");
        process.exit();
    }

    debug_print(["sw R"+(r_1+1)+" R"+(r_2+1)]);

    //setup the RAM at location @r_1 with the contents of r_2
    const b1 =  REGISTERS[r_2]>>8;
    const b2 = (REGISTERS[r_2] & 0x00FF);
    RAM[REGISTERS[r_1]] = b1;
    RAM[REGISTERS[r_1]+1] = b2;

    //setup registers
    PC+=2;
}

function handle_bytes_lw(byte_position: BytePosition){
    const r_1 = ((RAM[byte_position.byte_position] & 0xF0) >> 4) -1;
    const r_2 = RAM[++(byte_position.byte_position)] -1;

    if(r_1 > 2 || r_1 < 0 || r_2 > 2 || r_2 < 0){
        console.log("Error, general register can only be  R1 R2 R3");
        process.exit();
    }

    debug_print(["lw R"+(r_1+1)+" R"+(r_2+1)]);

    //setup registers
    PC+=2;
    //get the 2 bytes at ram starting from location of r_2 
    const data = RAM[REGISTERS[r_2]];
    const data2 = RAM[REGISTERS[r_2]+1];
    REGISTERS[r_1]= ( data << 8) | data2;
}

function handle_bytes_add(byte_position: BytePosition){
    const r_1 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;
    const r_2 = (RAM[++(byte_position.byte_position)] & 0xF) -1;
    const r_3 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;


    if(r_1 > 2 || r_1 < 0 || r_2 > 2 || r_2 < 0 || r_3 > 2 || r_3 < 0){
        console.log("Error, general register can only be  R1 R2 R3");
        process.exit();
    }

    debug_print(["add R"+(r_1+1)+" R"+(r_2+1)+" R"+(r_3+1)]);

    //setup registers
    PC+=2;
    //we do this to avoid moving past 16bits which number does by default
    let data = new Uint16Array([REGISTERS[r_2]+REGISTERS[r_3]]);
    //wrap around the data once it goes beyond 0xFFFF
    REGISTERS[r_1] = Number(data);
}

function handle_bytes_sub(byte_position: BytePosition){
    const r_1 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;
    const r_2 = (RAM[++(byte_position.byte_position)] & 0xF) -1;
    const r_3 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;


    if(r_1 > 2 || r_1 < 0 || r_2 > 2 || r_2 < 0 || r_3 > 2 || r_3 < 0){
        console.log("Error, general register can only be  R1 R2 R3");
        process.exit();
    }

    debug_print(["sub R"+(r_1+1)+" R"+(r_2+1)+" R"+(r_3+1)]);
    
    //setup registers
    PC+=2;
    //we do this to avoid moving past 16bits which number does by default
    let data = new Uint16Array([REGISTERS[r_2]-REGISTERS[r_3]]);
    //wrap around the data once it goes beyond 0xFFFF
    REGISTERS[r_1] = Number(data);
}

function handle_bytes_mult(byte_position: BytePosition){
    const r_1 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;
    const r_2 = (RAM[++(byte_position.byte_position)] & 0xF) -1;
    const r_3 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;


    if(r_1 > 2 || r_1 < 0 || r_2 > 2 || r_2 < 0 || r_3 > 2 || r_3 < 0){
        console.log("Error, general register can only be  R1 R2 R3");
        process.exit();
    }

    debug_print(["mult R"+(r_1+1)+" R"+(r_2+1)+" R"+(r_3+1)]);
    
    //setup registers
    PC+=2;
    //we do this to avoid moving past 16bits which number does by default
    let data = new Uint16Array([REGISTERS[r_2]*REGISTERS[r_3]]);
    //wrap around the data once it goes beyond 0xFFFF
    REGISTERS[r_1] = Number(data);
}

function handle_bytes_div(byte_position: BytePosition){
    const r_1 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;
    const r_2 = (RAM[++(byte_position.byte_position)] & 0xF) -1;
    const r_3 = ((RAM[byte_position.byte_position] & 0xF0) >> 4)-1;


    if(r_1 > 2 || r_1 < 0 || r_2 > 2 || r_2 < 0 || r_3 > 2 || r_3 < 0){
        console.error("Error, general register can only be  R1 R2 R3");
        process.exit();
    }

    debug_print(["div R"+(r_1+1)+" R"+(r_2+1)+" R"+(r_3+1)]);

    if(REGISTERS[r_3]==0){
        console.error("div with R"+(r_3+1)+" Can't happen since it's zero");
        process.exit();
    }
    
    //setup registers
    PC+=2;
    //we do this to avoid moving past 16bits which number does by default
    let data = new Uint16Array([REGISTERS[r_2]/REGISTERS[r_3]]);
    //wrap around the data once it goes beyond 0xFFFF
    REGISTERS[r_1] = Number(data);
}

function handle_bytes_j(byte_position: BytePosition){
    const d_1 = RAM[++(byte_position.byte_position)];
    const d_2 = RAM[++(byte_position.byte_position)];
    const data = (d_1 << 8) | d_2;

    debug_print(["j 0x"+data.toString(16)]);

    // set position to one byte before the data position due
    // to line increment at line 294
    byte_position.byte_position=data-1;
    //setup registers
    PC=data;
}


function handle_bytes_jr(byte_position: BytePosition){
    const d_1 = RAM[++(byte_position.byte_position)] -1;
    const r_1 = REGISTERS[d_1];

    debug_print(["jr R"+(d_1+1)]);

    // set position to one byte before the data position due
    // to line increment at line 294
    byte_position.byte_position=PROG_SECTION+r_1-1;
    //setup registers
    PC = PROG_SECTION + r_1;
}


function handle_bytes_beq(byte_position: BytePosition){
    const d_1 = RAM[(byte_position.byte_position)] ;
    const d_2 = RAM[++(byte_position.byte_position)] ;

    const r_1 = ((d_1 & 0xF0) >> 4) -1;
    const r_2 = (d_2 & 0x0F) -1;
    const r_3 = ((d_2 & 0xF0) >> 4) -1;

    debug_print(["beq R"+(r_1+1)+" R"+(r_2+1)+" R"+(r_3+1)]);

    if(REGISTERS[r_1]==REGISTERS[r_2]){
        //move to program location stored in r_3
        //use -1 due to increment on handle_instruction()
        byte_position.byte_position=PROG_SECTION+REGISTERS[r_3]-1;
        PC = PROG_SECTION + REGISTERS[r_3];
        console.log("MOVE TO r3:",REGISTERS[r_3].toString(16));
        return;
    }

    //setup registers
    PC += 2;
}

function handle_bytes_inc(byte_position: BytePosition){
    const r_1 = RAM[++(byte_position.byte_position)] -1;

    debug_print(["inc R"+(r_1+1)]);

    REGISTERS[r_1]+=1;

    //setup registers
    PC+=2;
}

function handle_bytes_dec(byte_position: BytePosition){
    const r_1 = RAM[++(byte_position.byte_position)] -1;

    debug_print(["dec R"+(r_1+1)]);

    REGISTERS[r_1]-=1;

    //setup registers
    PC+=2;
}

function handle_instruction(byte_position: BytePosition){
    print_state_of_registers("--BEFORE--");
    //this is the 8 bits that normally contains the instruction type
    let u8 = RAM[byte_position.byte_position];
    let instruction = u8 & 0x0F;

    switch(op_codes.get(instruction)){
        case "halt": debug_print(["halting"]);process.exit(0);
        case "nop": handle_bytes_nop(byte_position); break;
        case "li": handle_bytes_li(byte_position);break;
        case "lw": handle_bytes_lw(byte_position);break;
        case "sw": handle_bytes_sw(byte_position);break;
        case "add": handle_bytes_add(byte_position);break;
        case "sub": handle_bytes_sub(byte_position);break;
        case "mult": handle_bytes_mult(byte_position);break;
        case "div": handle_bytes_div(byte_position);break;
        case "j": handle_bytes_j(byte_position);break;
        case "jr": handle_bytes_jr(byte_position);break;
        case "beq": handle_bytes_beq(byte_position);break;
        case "inc": handle_bytes_inc(byte_position);break;
        case "dec": handle_bytes_dec(byte_position);break;
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
