# Create a set of questions with answers 
# Ask a question & player will answer it
# Show if the answer is correct or incorrect
# Publish the score
import random

questions = {
    'Question: What is the largest ocean in the world?':'pacific', 
    'Question: Who wrote the play Romeo and Juliet?' :'william shakespeare',
    'Question: What is the chemical symbol for gold?':'au',
    'Question: Which planet is known as the Red Planet?':'mars',
    'Question: How many continents are there on Earth?':'seven',
    'Question: What is the capital city of Australia?':'canberra',
    'Question: Who painted the Mona Lisa?':'leonardo da vinci',
    'Question: What is the currency of the United Kingdom?':'pounds',
    'Question: How many strings does a standard violin have?':'four',
    'Question: What is the hardest natural substance on Earth?':'diamond'
}

def python_trivia_game():
    questions_list = list(questions.keys())
    total_questions = 5
    score = 0
    selected_questions = random.sample(questions_list, total_questions)
    
    for idx, question in enumerate (selected_questions):
        print(f"{idx+1}. {question}")
        user_answer = input(f"Your answer. ").lower().strip()

        correct_answer = questions[question]
        if user_answer == correct_answer.lower():
            print("Correct!\n")
            score += 1
        else:
            print(f"Wrong. The correct answer is {correct_answer}\n")
    print(f"You have scored {score} points. Congrats")

python_trivia_game()
