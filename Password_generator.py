# Take user input on password format
# User input on password length
# Build the main set of characters in the password
# Generate a password
# Check against the conditions
# Confirm or reject

import string
import random

def password_generate():
    length = int(input("Enter the length of the password: ").strip())
    include_uppercase = input("Enter if you want to include Upper case (yes/no): ").strip().lower()
    include_digits = input("Enter if you want to include digits (yes/no): ").strip().lower()
    include_special = input("Enter if you want to include special characters (yes/no): ").strip().lower()
    print(f"Your input length {length}, uppercase {include_uppercase}, numbers {include_digits}, special characters {include_special}.\n")

    if length <= 4:
        print("Password length cannot be less than 4 character. Exit")
        return
    
    lower = string.ascii_lowercase
    upper = string.ascii_uppercase if include_uppercase == "yes" else ""
    special = string.punctuation if include_special == "yes" else ""
    number = string.digits if include_digits == "yes" else ""
    
    all_characters = lower+upper+special+number
    
    # Start building the password
    interim_password = []
    if include_uppercase == "yes":
        interim_password.append (random.choice(upper))
    if include_special == "yes":
        interim_password.append (random.choice(special))
    if include_digits == "yes":
        interim_password.append (random.choice(number))

    print(interim_password)
    interim_length = len(interim_password)
    for _ in range(length - interim_length):
        interim_password.append(random.choice(all_characters))
    print(f"The password is.\n{interim_password}")
    random.shuffle(interim_password)
    final_password = "".join(interim_password)
    print(f"The final password is.\n{final_password}")


password_generate()