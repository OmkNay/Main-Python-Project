# Definition of global variables
MAX_LINES=3
MAX_BET = 100
MIN_BET = 1


# SLot machine core
import random
rows = 3
cols = 3
symbols_count = {
    "A":2,
    "B":4,
    "C":6,
    "D":8
}

symbol_value = {
    "A":5,
    "B":4,
    "C":3,
    "D":2
}
# Calculate winnings
def check_winnings(columns, lines, bet, values):
    winnings = 0
    winning_lines = []
    for line in range(lines):
        symbol = columns[0][line]
        for column in columns:
            symbol_to_check = column[line]
            if symbol != symbol_to_check:
                break
        else:
            winnings += values[symbol] * bet
            winning_lines.append(line + 1)

    return winnings, winning_lines

def get_slot_machine_spin (rows, cols, symbols):
    all_symbols = []
    for symbol,symbol_count in symbols.items():
        for _ in range(symbol_count):
            all_symbols.append (symbol)
    columns = []
    for _ in range(cols):
        column = []
        current_symbols = all_symbols[:]
        for _ in range (rows):
            value = random.choice(current_symbols)
            current_symbols.remove(value)
            column.append(value)
        columns.append(column)
    return columns

def print_slot_machine (columns):
    for row in range (len(columns[0])):
        for i, column in enumerate(columns):
            if i != len(columns) - 1:
                print(column[row], end=" | ")
            else:
                print(column[row], end="")
        print()

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

#Take no of lines to bet on
def get_no_of_lines():
    while True:
        lines = input("Enter the number of lines between 1 & " + str(MAX_LINES) +" ")
        if lines.isdigit():
            lines = int(lines)
            if 1 <= lines <= MAX_LINES:
                break
            else:
                print("Enter the correct number of lines")
        else:
            print("Enter a valid number")
    
    return lines

# Take bet per line
def get_bet():
    while True:
        betamt = input("Enter the amount to bet per line: ")
        if betamt.isdigit():
            betamt = int(betamt)
            if MIN_BET <= betamt <= MAX_BET:
                break
            else:
                print(f"Enter a value between {MIN_BET} and {MAX_BET}")
        else:
            print("Enter a valid number")
    return betamt

# Balance check for spin
def spin (balance):
    lines = get_no_of_lines()
    while True:
        bet = get_bet()
        total_bet = bet*lines

        if total_bet > balance:
            print (f"You do not have adequate balance to bet ${total_bet}. Reduce your bet per line from ${bet}")

        else:
            break
    print(f"Your per line bet is ${bet} for {lines} lines. Total bet amount is ${total_bet}")

    slots = get_slot_machine_spin(rows, cols, symbols_count) 
    print_slot_machine (slots)
    winnings, winning_lines = check_winnings(slots, lines, bet,symbol_value)
    print (f"You won ${winnings}.")
    print(f"You won on lines {winning_lines}")

    return winnings - total_bet


#Define main function
def main():
    balance = deposit()
    
    while True:
        print(f"Current balance is ${balance}")
        answer = input ("Press Enter to play & q to quit")
        if answer == "q":
            break
        balance += spin(balance)

    print (f"You are left with ${balance}")
main()  