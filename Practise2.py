#Try various variables - Tupple (), fixed List - no append, add or remove operations
# Try various variables - Sets {}
import time
animals = {"lion", "tiger", "monkey", "cheetah", "elephant"}
for a in animals:
    print (a)
    print()

print ("---add---")
animals.add ("hyena")

time.sleep (2)
for a in animals:
    print (a)
    print()

print ("---delete---")
animals.remove ("lion")

time.sleep (2)
for a in animals:
    print (a)
    print()

print ("---add by input---")

print ("Input an animal to add")
add_animal = input()

while add_animal == "":
    print ("Field cannot be blank")
    print ("Input animal name")
    add_animal = input()

animals.add (add_animal)

time.sleep (2)
for a in animals:
    print (a)
    print()

print ("---delete by input---")

print ("Input an animal to remove")
del_animal = input()

while del_animal == "":
    print ("Field cannot be blank")
    print ("Input animal name to delete")
    del_animal = input()

animals.remove (del_animal)

time.sleep (2)
for a in animals:
    print (a)
    print()