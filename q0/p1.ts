import * as fs from "fs";
import * as readline from "readline";

type address = number;

/** Hold opcodes with their mnemonics */
let op_codes = new Map<string,number>([["halt",0x0], ["nop",0x1], ["li",0x2],
    ["lw",0x3],["sw",0x4], ["add",0x5], ["sub",0x6], ["mult",0x7],
    ["div",0x8], ["j",0x9], ["jr",0xA], ["beq",0xB], ["bne",0xC],
    ["inc",0xD], ["dec",0xE]]);

let labels = new Map<string, address>();

function reset_file(file_passed: string){
    fs.writeFileSync(file_passed, "", 'utf8');
}

function write_bytes(file_passed: string, bytes_passed: Uint8Array){
    fs.appendFileSync(file_passed,bytes_passed);
}

async function fill_labels(file_passed: string){
    let stream = fs.createReadStream(file_passed);
    let reader = readline.createInterface({
        input: stream,
    });
    let address = 0;
    for await (let line of reader){
        line = line.trim();
        if(line.startsWith(";")){
            continue;
        }else if(line.startsWith("li") || line.startsWith("j")){
            //since this means we go a byte past the normal instruction set
            //so we do add extra 8 bits past the address location
            address+=1;
        }else if(line.search(":")>=0){
            line = line.replace(":","");
            labels.set(line, address);
        }
        address+=2;
    }
}

function handle_writing_li_bytes(line:string,
    line_split: string[], line_num: number, out_file: string){
    let data = new Uint8Array();
    if(line_split[2].startsWith("0x")){
        // data section of instruction
        const d = line_split[2];
        const ox = "0x";
        //try getting the two bytes that are involved
        let p1 = ox+d.slice(6,8);
        let p2 = ox+d.slice(8,10);
        console.log("p1:",p1);
        console.log("p2:",p2);
        data = new Uint8Array([Number(p1),Number(p2)]);
    }else{
        let num = labels.get(line_split[2]);
        if(num!=undefined){
            //use address and insert a split if it is more than 255
            if(num>255){
                console.log("p1:")
                data = new Uint8Array([num, 255-num]);
                console.log("d:",data[0],data[1]);
            }else{
                data = new Uint8Array([num]);
                console.log("d:",data[0]);
            }
        }else{
            console
                .error("Failed to get data field in li at line:"
                    , line_num);
            process.exit(-1);
        }
    }
    let op_code_num = op_codes.get(line_split[0]);
    if(op_code_num!=undefined){
        let op_code_reg = op_code_num |
            (Number(line_split[1][1])<<4) 

        console.log("data: ",data,"length: ",data.length);
        if(data.length==2){
            let bytes = new Uint8Array([op_code_reg,
                data[0],data[1]]);
            write_bytes(out_file,bytes);
        }else if(data.length==1){
            let bytes = new Uint8Array([op_code_reg,
                0x00,data[0]]);
            write_bytes(out_file,bytes);
        }else{
            console.error("Undefined error when parsing line:",
                line_num);
            console.error("data field: ",data);
            process.exit(-1);
        }

    }else{
        console.error("Undefined error when parsing line:",line);
        process.exit(-1);
    }
}

function handle_writing_halt_bytes(out_file: string){
    let bytes = new Uint8Array([0,0]);
    write_bytes(out_file,bytes);
}

function handle_do_nothing(out_file: string){
    let do_nothing_num = op_codes.get("nop")!;
    let bytes = new Uint8Array([do_nothing_num,0]);
    write_bytes(out_file,bytes);
}

function handle_writing_lw_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let lw_op_and_r = lw_op | Number(line_split[1][1]) << 4;
    let second_r = Number(line_split[2][1]);
    const bytes = new Uint8Array([lw_op_and_r, second_r]);
    write_bytes(out_file, bytes);
}


function handle_writing_sw_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let lw_op_and_r = lw_op | Number(line_split[1][1]) << 4;
    let second_r = Number(line_split[2][1]);
    const bytes = new Uint8Array([lw_op_and_r, second_r]);
    write_bytes(out_file, bytes);
}

function handle_writing_add_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let lw_op_and_r = lw_op | Number(line_split[1][1]) << 4;
    let second_r_and_third_r = Number(line_split[2][1]) | 
        Number(line_split[3][1]) << 4;
    const bytes = new Uint8Array([lw_op_and_r, second_r_and_third_r]);
    write_bytes(out_file, bytes);
}


function handle_writing_sub_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let lw_op_and_r = lw_op | Number(line_split[1][1]) << 4;
    let second_r_and_third_r = Number(line_split[2][1]) | 
        Number(line_split[3][1]) << 4;
    const bytes = new Uint8Array([lw_op_and_r, second_r_and_third_r]);
    write_bytes(out_file, bytes);
}


function handle_writing_mult_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let lw_op_and_r = lw_op | Number(line_split[1][1]) << 4;
    let second_r_and_third_r = Number(line_split[2][1]) | 
        Number(line_split[3][1]) << 4;
    const bytes = new Uint8Array([lw_op_and_r, second_r_and_third_r]);
    write_bytes(out_file, bytes);
}


function handle_writing_div_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let lw_op_and_r = lw_op | Number(line_split[1][1]) << 4;
    let second_r_and_third_r = Number(line_split[2][1]) | 
        Number(line_split[3][1]) << 4;
    const bytes = new Uint8Array([lw_op_and_r, second_r_and_third_r]);
    write_bytes(out_file, bytes);
}


function handle_writing_j_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let data_b1 = Number('0x'+line_split[1].slice(6,8));
    let data_b2 = Number('0x'+line_split[1].slice(8,10));
    const bytes = new Uint8Array([lw_op, data_b1, data_b2]);
    write_bytes(out_file, bytes);
}


function handle_writing_jr_bytes(line_split: string[], out_file: string){
    let lw_op = op_codes.get(line_split[0].toLowerCase())!;
    let reg = Number(line_split[1][1]);
    const bytes = new Uint8Array([lw_op, reg]);
    write_bytes(out_file, bytes);
}

function handle_writing_bne_bytes(line_split: string[], out_file: string){
    let op = op_codes.get(line_split[0].toLowerCase())!;
    let op_r1 = op | Number(line_split[1][1]) << 4;
    let r2_r3 = Number(line_split[2][1]) | Number(line_split[3][1]) << 4;
    const bytes = new Uint8Array([op_r1, r2_r3]);
    write_bytes(out_file, bytes);
}

function handle_writing_beq_bytes(line_split: string[], out_file: string){
    let op = op_codes.get(line_split[0].toLowerCase())!;
    let op_r1 = op | Number(line_split[1][1]) << 4;
    let r2_r3 = Number(line_split[2][1]) | Number(line_split[3][1]) << 4;
    const bytes = new Uint8Array([op_r1, r2_r3]);
    write_bytes(out_file, bytes);
}


function handle_writing_inc_bytes(line_split: string[], out_file: string){
    let op = op_codes.get(line_split[0].toLowerCase())!;
    let r1 = Number(line_split[1][1]);
    const bytes = new Uint8Array([op, r1]);
    write_bytes(out_file, bytes);
}


function handle_writing_dec_bytes(line_split: string[], out_file: string){
    let op = op_codes.get(line_split[0].toLowerCase())!;
    let r1 = Number(line_split[1][1]);
    const bytes = new Uint8Array([op, r1]);
    write_bytes(out_file, bytes);
}

/** Here is where we do the writing of bytes as we read the 
 * instructions line by line
 */
async function produce_bytes(in_file:string, out_file:string){
    let stream = fs.createReadStream(in_file);
    let reader = readline.createInterface({
        input: stream,
    });
    let line_num = 0;
    for await (let line of reader){
        ++line_num;
        line = line.trim();
        //skip comments
        if(line.startsWith(";") || line.search(":")>=0){
            continue;
        }

        let line_split = line.split(" ");

        switch(line_split[0].toLowerCase()){
            case "li": handle_writing_li_bytes(line, line_split,
                line_num, out_file); break;
            case "halt": handle_writing_halt_bytes(out_file);break;
            case "nop": handle_do_nothing(out_file);break;
            case "lw": handle_writing_lw_bytes(line_split,out_file);break;
            case "sw": handle_writing_sw_bytes(line_split,out_file);break;
            case "add": handle_writing_add_bytes(line_split,out_file);break;
            case "sub": handle_writing_sub_bytes(line_split,out_file);break;
            case "mult": handle_writing_mult_bytes(line_split,out_file);
                break;
            case "div": handle_writing_div_bytes(line_split,out_file);break;
            case "j": handle_writing_j_bytes(line_split, out_file);break;
            case "jr": handle_writing_jr_bytes(line_split, out_file);break;
            case "bne": handle_writing_bne_bytes(line_split,out_file);break;
            case "beq": handle_writing_beq_bytes(line_split,out_file);break;
            case "inc": handle_writing_inc_bytes(line_split,out_file);break;
            case "dec": handle_writing_dec_bytes(line_split,out_file);break;
            default: console.log("Not handling:",line_split[0])
        }

        console.log(line_split);
    }
}

console.log("Compiling...");

if(process.argv.length != 4){
    console.error("Error: use python asm.py input.s output.bin");
    console.error(process.argv);
    process.exit(-1);
}

let in_file = process.argv[2]
let out_file = process.argv[3]
reset_file(out_file)
await fill_labels(in_file)

await produce_bytes(in_file, out_file);

console.log("Done Compiling")
