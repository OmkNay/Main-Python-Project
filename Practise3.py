# Take deposit
def deposit():
    while True:
        amount = input("Enter amount you would like to deposit: $")
        if amount.isdigit():
            amount = int(amount)
            if amount >0:
                break
            else:
                print("Enter a number greater than zero")
        else:
            print("Enter a whole number")
    return amount

# Take bet per line
MAX_BET = 100
MIN_BET = 1
def get_bet():
    while True:
        betamt = input("Enter the amount to bet per line: ")
        if betamt.isdigit():
            betamt = int(betamt)
            if MIN_BET <= betamt <= MAX_BET:
                print(betamt)
                break
            else:
                print(f"Enter a value between {MIN_BET} and {MAX_BET}")
        else:
            print("Enter a valid number")
    return betamt

get_bet()
