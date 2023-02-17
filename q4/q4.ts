/**
 * ∧ -> means &&
 * ∨ -> means ||
 * = -> means ==
 * ¬ -> means not or ! which has highest precendance
 */

import fs from "fs";
import vm from "vm";

const PROMPT = "λ> ";
let DEBUG = false;

/// For holding all the variables created by the interpreter during runtime
let VARIABLES: Map<string, boolean> = new Map();

/// This is to setup buffer and stdin, stdout
let buf = Buffer.alloc(512);
let stdin: number = process.stdin.fd;
let stdout: number = process.stdout.fd;
try{ 
  stdin = fs.openSync('/dev/stdin',"rs");
}catch(e){ }


/// Function to print list passed to it if DEBUG variable is true
function debug_print(vars: [any]){
  if(DEBUG==true){
    vars.forEach(v=> console.log(v));
  }
}

/// Turns boolean to T if true, F is false
function turn_bool_to_letter(bool: boolean):string{
  if(bool){
    return "T";
  }else{
    return "F";
  }
}

function turn_bool_to_string(bool: boolean): string{
  if(bool){
    return "true";
  }else{
    return "false";
  }
}

function eval_values(input: string):boolean{
  let input_filtered = input.split("\n")[0].trim();
  debug_print(["eval: "+input_filtered]);
  return vm.runInNewContext(input_filtered);
}

/**
 * Goes through all fields in VARIABLE that might be 
 * referenced by the input string replacing their boolean
 * value with the reference
 */
function handle_replacing_variables_with_vals(input:string):string{
  let input_split = input.split(" ");
  for(let i=0;i<input_split.length;++i){
    if(input_split[i].length==0){
      continue;
    }
    if(VARIABLES.has(input_split[i])){
      input_split[i] = turn_bool_to_string(VARIABLES.get(input_split[i])!);
    }else if(VARIABLES.has(input_split[i].replace("!","").trim()) && 
      input_split[i][0]=='!'){
      //handle if contains a ! before the VARIABLE
      input_split[i] = turn_bool_to_string(!VARIABLES.get(input_split[i])!);
    }
  }
  return input_split.join(" ").trim();
}

/** Variables should only exist around a = variable.
 * with the let keyword coming before the variable name
 * after identifying all the variables and storing them in their VARIABLE
 * promp
 */
function handle_variables_and_execute(buf: Buffer){
  let original_input_copy = buf.toLocaleString().split("\n")[0].trim();
  let input = buf.toLocaleString().split("\n")[0].trim();

  if(input=="exit"){
    process.exit(0);
  }

  //do nothing if user gave nothing as input
  if(input.length==0){
    return;
  }

  // replace common fields
  input = input.replace(/T/g,"true");
  input = input.replace(/F/g,"false");
  input = input.replace(/∧/g,"&&");
  input = input.replace(/∨/g,"||");
  input = input.replace(/¬/g,"!");


  let equal_location = input.search("=");
  if(equal_location>0){
    let before_equal = input.slice(0,equal_location);
    if(before_equal.search("let")>=0) {
      let variable_before_equal = before_equal.replace("let","").trim();
      if(variable_before_equal.length>0){
        let input_after_equal = input.slice(equal_location+1);
        input_after_equal = handle_replacing_variables_with_vals(input_after_equal);
        //replace all = after the first with ==
        input_after_equal = input_after_equal.replace(/=/,"==");
        //set the variable
        try{
          VARIABLES.set(variable_before_equal,
            eval_values(input_after_equal) as boolean);
          debug_print([["VARIABLES:",VARIABLES]]);
        }catch(err){
          console.error("Failed to interpret string:",original_input_copy);
        }
        //print out
        fs.writeSync(stdout, variable_before_equal+": "+
          turn_bool_to_letter(VARIABLES.get(variable_before_equal)!)+"\n");
      }else{
        console.error("ERROR: let cmd must be followed with a variable name");
      }
      return;
    }
  }

  input = handle_replacing_variables_with_vals(input);
  input = input.replace(/=/g,"==");
  //we reach here if no variable is being set by the input
    //input = "true && false";
  try{
    let bool = eval_values(input);
    console.log(turn_bool_to_letter(bool));
  }catch(err){
    console.error("Failed to interpret string:",original_input_copy);
  }
}

/**
 * Main function
 */
function main(){
  //check if --debug field passed, if so then enable debug printing
  console.log("ARGS",process.argv);
  if(process.argv[2]=="--debug"){
    DEBUG=true;
  }
  console.log("Starting interpreter...");
  while(true){
    //show prompt
    fs.writeSync(stdout, PROMPT);
    // read user input
    fs.readSync(stdin, buf, 0, 256, null);

    handle_variables_and_execute(buf);

    //clear buffer
    buf = Buffer.alloc(512);
  }
}

main();
