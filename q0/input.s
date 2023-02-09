; a simple counter program.
dec R1
inc R1
beq R1 R2 R3
bne R1 R2 R3
jr R1
j 0x0000ABCD
div R3 R1 R2
mult R3 R1 R2
sub R3 R1 R2
add R3 R1 R2
sw R1 R2
lw R1 R2
nop
li R1 0x00000000
; end
li R2 0x0000FFFF
; memory location of loop start
li R3 loop
loop:
  ; store the contents of R1 at the memory location pointed by R1
  sw R1 R1
  ; increment the counter
  inc R1
  ; loop if the counter hasn't yet reached the end
  bne R1 R2 R3
  ; end program
  halt
