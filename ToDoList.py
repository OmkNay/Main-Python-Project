# Create and manage a To-Do List
import json

file_name = "todo_list.json"

def load_tasks():
    try:
        with open(file_name,"r") as file:
            return json.load(file)
    except:
        return {"tasks" : []}

def save_tasks(tasks):
    try:
        with open(file_name, "w") as file:
            json.dump(tasks, file)
    except:
        print ("Failed to save")

def view_tasks(tasks):
    print()
    task_list= tasks["tasks"]

    if len(task_list)==0:
        print("There are no tasks to display.")
    else:
        print("Your to-do list is: \n")

    for idx, task in enumerate (task_list):
        status = "[Completed]" if task == ["complete"] else "[Pending]"
        print(f"{idx+1}. {task['description']} | {status}")

def create_task(tasks):
    description = input("Enter a task: ").strip()
    if description:
        tasks["tasks"].append ({"description":description, "complete": False})
        save_tasks(tasks)
        print("\nTask has been added.\n")
    else:
        print("Description cannot be empty\n")
    

def mark_tasks_complete(tasks):
    view_tasks(tasks)
    try:

        task_number = int(input("\nEnter the task number to mark complete: ")).strip()
    
        if 1<=task_number<= len(tasks):
            tasks["tasks"][task_number-1]["complete"] = True
            save_tasks(tasks)
            print("\nMarked as complete.")
        else:
            print("Task number is invalid.\n")
        
    except:
        print("Enter a valid number.")
    
        

def main():
    
    tasks = load_tasks()
    

    while True:
        print("\nWhat do you want to do?\n")
        print("1. View Tasks\n")
        print("2. Add Tasks \n")
        print("3. Complete Tasks\n")
        print("4. Exit\n")
        # Learning: Can use choice as int also
        choice = input("Enter your choice: ").strip()

        if choice == "1":
            view_tasks(tasks)
        elif choice == "2":
            create_task(tasks)
        elif choice == "3":
            mark_tasks_complete(tasks)
        elif choice == "4":
            print("Goodbye")
            break
        else:
            print("Enter a valid number from - 1, 2, 3 or 4\n")

main()