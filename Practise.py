#Use of If to provide age wise bucket

age = 0
print (f"Hallo, Ich kann deinen situation sagen?")

age = input("Wie alt bist du?")
age = int(age)

if age >18 and age <30:
    print (f"Du bist ein erwachsener")

elif age <2:
    print (f"Du bist ein kliens baby")

elif age <8:
    print (f"Du bist ein kliens Kind")

elif age <14:
    print (f"Du bist ein junger Teenager") 

elif age >30 and age <60:
    print (f"Du bist ein alt erwachsener")

elif age >60 and age<80:
    print (f"Du bist ein senior")

elif age >80:
    print (f"Du bist junge weider") 

else:
    print (f"Du bist ein Kind")

print ("`----------------------------- ")
print ("/n")

#Use of If to provide grade wise bucket

#Learning while loop

i = 10

while i > 0:
    print (f"Hallo, Die countup zähle runter: {i}")
    i -= 8
print ("`----------------------------- ")
print ("/n")

name = input ("Wie heißt du?: ")
while name == "":
    print ("Du musst deinen Namen eingeben")
    name = input ("Wie heißt du?: ")

print (f"Hallo {name}, schön dich kennenzulernen!")
print ("`----------------------------- ")
print ("/n")

#try while for entry of name and age

name1 = input ("Wie heist du?: ")
age1 = float(input ("Wie alt bist du?: "))

print (type (name1))
print (type (age1))

while name1 == "":
    print ("Du musst deine Name eingeben.")
    name1 = input ("Wie heist du?; ")

while age1 < 0:

    print ("Age kann nicht negative bin.")
    age1 = float((input ("Wie alt bist du?; ")))

age1 = int(age1)
print (f"Hallo {name1}, du bist {age1} jahre alt.")

print ("----------------")
print ("/n")


#Try for loop

import time
for i in range (1,11,1):
    print (i)
    time.sleep (0.1)
print ("Happy New Year")

name = "Omkar nayak"
for letter in name:
    print (letter, end="-")
    print()

#Try various variables - List, 

fruits = ["apple", "mango", "orange", "banana", "litchi"]
for i in range (0,5,1):
    print (f"Ich liebe {fruits[i]}")
    print()

prime_numbers = [1,2,3,5,7,11,13,17,19]
for i2 in range(0,8,1):
    print (f"{prime_numbers[i2]} is the {i2+1}th prime number")

print"------------------------")
print()

#Try various variables - List, 

import time
fruits = ["apple", "mango", "orange", "banana", "litchi"]
for a in fruits:
    print (a)
    print()

print ("---add new fruit----")
fruits.append ("chickoo")
time.sleep (2)
for a in fruits:
    print (a)
    print()

print ("--- remove fruit----")
fruits.remove ("apple")
time.sleep (2)
for a in fruits:
    print (a)
    print()

print ("--- remove by index fruit----")
fruits.pop (1)
time.sleep (2)
for a in fruits:
    print (a)
    print()


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