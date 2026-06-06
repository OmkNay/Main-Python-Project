# Game to understand if else

name = input("Enter your name: ")
print(f" Hello "+ name + " Welcome to the Walking game\n")

play = input("Do you want to play the game now?").lower()

if play == "yes" or play == "y":
    print("Lets go on an adventure.\n")
    direction = input("Which direction do you want to go? Left / Right : ").lower()

    if direction == "right":
        print("You went right. You reach a bridge.\n")
        decision1 = input("Do you want to jump in the river or walk? Jump / Walk : ").lower()
        if decision1 == "jump":
            print("You jumped into a river & got eaten by a crocodile. \n")
        elif decision1 == "walk":
            print("You keep walking, get a lift and reach home. You are safe.\n")
        else:
            print("You did not decide. The bridge collapses but you get saved by the rescue team, but loose your memory.\n")

    elif direction == "left":
        print("You went left. You reach the base of the mountain\n")
        decision2 = input("You want to climb the mountain or go in the jungle? Climb / Jungle : ").lower()
        if decision2 == "Climb":
            print ("You climb the mountain, reach the summit, find an eagles nest with a golden egg. You are rich.\n")
        elif decision2 == "jungle":
            print("You walk in the jungle, fall into a bear trap, but are saved by natives. You are king of the jungle.\n")
        else:
            print("You did not decide, you stayed in the place and were caught in a landslide. You are buried.\n")
    else:
        print("You did not choose left or right. You fall in the ditch & died\n")

else:
    print("Thanks for your time. Goodbye.\n")

