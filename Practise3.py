# Create and manage a To-Do List

def load_tasks():
    pass

def save_tasks():
    pass

def create_task():
    pass

def mark_tasks_complete():
    pass

def view_tasks():
    pass

def main():
    
    while True:
        print("\nWhat do you want to do?\n")
        print("1. View Tasks\n")
        print("2. Add Tasks \n")
        print("3. Complete Tasks\n")
        print("4. Exit\n")
        choice = input("Enter your choice: ").strip()
        choice = int(choice)

        if choice == 1:
            view_tasks()
        elif choice == 2:
            create_task()
        elif choice == 3:
            mark_tasks_complete()
        elif choice == 4:
            break
        else:
            print("\nEnter a valid number from - 1, 2, 3 or 4\n")

main()
