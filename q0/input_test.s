; a simple program to test exexcution of all instructions.
nop
back:
li R1 0x00001234
sw R2 R1
lw R3 R2
add R2 R1 R3
sub R3 R1 R1
li R3 0x00000002
mult R3 R1 R3
li R3 0x00000002
div R2 R2 R3
inc R3
dec R3
li R3 back
;beq R1 R2 R3
bne R1 R2 R3
;jr R3
;j 0x0000CFFF
halt
