; a simple program to test exexcution of all instructions.
nop
li R1 0x00001234
sw R2 R1
lw R3 R2
add R2 R1 R3
sub R3 R1 R1
li R3 0x00000002
mult R3 R1 R3
halt
