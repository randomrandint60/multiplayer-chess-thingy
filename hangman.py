import random

List = ["Computer", "Sphinx", "Cryptic", "Zigzag", "Yolk", "Fluff", "Quid", "Gnarled", "Rhythms", "Pixel","calculator","quantify", "expansive", "deviate", "moth","Levitate","Accord","Testifiy"   ]
print("Welcome to hangman")

wrong = 0

def reset_hang():
    global wrong
    wrong = 0

def reset_listing():
    global word
    word = random.choice(List)
    word = word.lower()

def reset_thing():
   global already
   already = [" "] 

def reset_display():
    global displaylist
    displaylist = ["-"] * len(word)

def question_():
    global already
    global List 
    global word
    global wrong
    global displaylist
    a = input("Enter a letter in the hangman word: ")
    a = a.lower()
    while a in already:
        print("You already got this letter before")
        a = input("Enter a letter in the hangman word: ")
        a = a.lower()
    already.append(a)
    
    if a in word:
        print(f"The letter {a} is in the word ")
        for i in range(len(word)):
            if a == word[i]:
                displaylist[i] = a 
    else:
        print(f" {a} isn't in the word")
        wrong += 1
    print(f"Word: {' '.join(displaylist)}")
    print(f"Guessed letters: {already}")
playing = True

while playing == True:
    reset_hang()
    reset_listing()
    reset_thing()
    reset_display()


    while wrong < 6 and "-" in displaylist:
        if wrong == 0:
            print("""
            ︱---------
            ︱
            ︱
            ︱
            ︱
            ︱
            ︱
            """)
        if wrong == 1:
            print("""
            ︱---------
            ︱        ╽
            ︱
            ︱
            ︱
            ︱
            ︱
            """)
        if wrong == 2:
            print("""
            ︱---------
            ︱        ╽
            ︱        O
            ︱
            ︱
            ︱
            ︱
            """)
        if wrong == 3:
            print("""
            ︱---------
            ︱        ╽
            ︱        O
            ︱        │
            ︱
            ︱
            ︱
            """)
        if wrong == 4:
            print("""
            ︱---------
            ︱        ╽
            ︱        O
            ︱       ╱│
            ︱
            ︱
            ︱
            """)
        if wrong == 4: 
            print("""
            ︱---------
            ︱        ╽
            ︱        O
            ︱       ╱│╲
            ︱
            ︱
            ︱
            """)
        if wrong == 5:
            print("""
            ︱---------
            ︱        ╽
            ︱        O
            ︱       ╱│╲
            ︱        │
            ︱
            ︱
            """)
        
        question_()
    if "-" not in displaylist:
        print(f"Winner! You found the word: {word}")
    else:
        print("""
        ︱---------
        ︱        ╽
        ︱        O
        ︱       ╱│╲
        ︱        │
        ︱       ╱ ╲
        ︱
        """)
        print(f"Game over the word was {word}") 
    again = input("Do you want to play again? (y/n): ")
    if again == "n":
        playing = False
        print("Thanks for playing!")
        break 