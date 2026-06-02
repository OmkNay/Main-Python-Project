import random

questions = {
  "Which country is the origin of the Olympic Games?":"greece",
  "What is the longest river in the world?":"nile",
  "Who was the first President of the United States?":"george washington",
  "In what year did the Titanic sink in the Atlantic Ocean?":"1912",
  "Which element makes up the majority of the Earth's atmosphere?":"nitrogen",
  "What is the smallest country in the world by land area?":"vatican",
  "Which organ in the human body produces bile?":"liver",
  "What is the capital of Japan?":"tokyo",
  "Who developed the theory of general relativity?":"einstein",
  "Which is the only continent in the world without a desert?":"europe"

}

def play_quiz():
    questions_count = 5
    score = 0
    questions_list = list(questions.keys())
    questions_set = random.sample(questions_list, questions_count)

    for idx, question in enumerate(questions_set):
        print(f"{idx + 1}. {questions_set[idx]}\n")
        answer = input("Enter your answer: ").lower().strip()
        correct_answer = questions[question]

        if answer == correct_answer.lower():
            score +=1
            print(f"Correct!\n")
        else:
            print(f"Your answer is incorrect. The correct answer is {correct_answer[idx]}.\n")
    print(f"Your total score is {score} out of {questions_count}.\n")

play_quiz()