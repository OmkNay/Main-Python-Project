winnings, winning_lines = check_winnings (slots,lines, bet, symbol_value)
print (f"You won ${winnings}.")
print (f"You won on lines:" *winning_lines)

#Calculate winnings
def check_winnings (columns, lines, bet, values):
    winnings = 0
    winning_lines = []
    for line in range (lines):
        symbol = columns[0][line]
        for column in columns:
            symbol_to_check = column[line]
            if symbol != symbol_to_check:
                break
        else:
            winnings += values[symbol]*bet
            winning_lines.append(line+1)
    return winnings, winning_lines




main()  