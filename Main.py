#This is my first python program

print ("Chimichurri Pizza ")
print ("Its really good")
print("-----------------------------")
print("\n")
#vriables
full_name = "omn yes"
age = 25
gpa = 1.1
is_student = False 
print (full_name)
print (f"Ich bin {full_name}")
print (f"Ich bin {age} Jahre alt")
print(f"Meine prufung gpa ist {gpa}")
print (f"Bist du ein student? {is_student}")

if is_student == True:
    print ("Du bist ein student")
else:
    print ("Du bist kein student")
print("-----------------------------")
print("\n")

#Arithmetic operators
num1 = 30
num2 = 4
addition = num1 + num2
subtraction = num1 - num2
multiplication = num1 * num2
division = num1 / num2
intdivision = num1 // num2
modulus = num1 % num2
print (f"Adding {num1} and {num2}: {addition}")
print (f"Subtracting {num1} and {num2}: {subtraction}")
print (f"Multiplying {num1} and {num2}: {multiplication}")
print (f"Dividing {num1} and {num2}: {division}")
print (f"Integer division of {num1} and {num2}: {intdivision}")
print (f"Modulus of {num1} and {num2}: {modulus}")
print("-----------------------------")
print("\n")

#augmentation
num1 -= 4
num2 += 2
addition = num1 + num2
subtraction = num1 - num2
multiplication = num1 * num2
division = num1 / num2
intdivision = num1 // num2
modulus = num1 % num2
print (f"Adding {num1} and {num2}: {addition}")
print (f"Subtracting {num1} and {num2}: {subtraction}")
print (f"Multiplying {num1} and {num2}: {multiplication}")
print (f"Dividing {num1} and {num2}: {division}")
print (f"Integer division of {num1} and {num2}: {intdivision}")
print (f"Modulus of {num1} and {num2}: {modulus}")
print("-----------------------------")
print("\n")

#typecasting

name1 = "omkar nayak"
age2 = 25
gpa2 = 1.1
is_student2 = True
print (type(name1))
print (type(age2))
print (type(gpa2))
print (type(is_student2))
print("-----------------------------")
print("\n")

#change the type of the variable
gpa2 = int(gpa2)
age2 = float(age2)
print (type(gpa2)) 
print (f"  Ich bin {age2} Jahre alt")
print (type(age2)) 
print (f"  Meine prufung gpa ist {gpa2}")
print("-----------------------------")
print("\n")

#take user input
name = input("What is your name? ")
age = input("What is your age? ")
age = int(age)
print (f"Hallo {name}, du bist {age} Jahre alt.")
print (f"In ein Jahre, bist du {age + 1} Jahre alt.")
print("-----------------------------")
print("\n")

#Use of If to provide age wise bucket


#Use of If to provide grade wise bucket