import random
list = ["Rock","Paper", "Scissors"]
play = input("Do you want to play rock paper scissors")
play = play.lower()
while play =="yes":
    comp = random.choice(list)
    print("Remember, in rock paper scissors, rock beats scissors, paper beats rock, and scissors beats paper")
    do = input("Do you chose rock, paper, or scissors")
    do = do.lower()
    if comp =="Scissors" and do == "scissors":
        print(f"You chose {do} and the computer chose {comp}")
        print("You tied with the computer")
        play = input("would you like to play again?")
    if comp =="Scissors" and do == "paper":
        print(f"You chose {do} and the computer chose {comp}")
        print("The computer won")
        play = input("would you like to play again?")
    if comp =="Scissors" and do == "rock":
        print(f"You chose {do} and the computer chose {comp}")
        print("You beat the computer")
        play = input("would you like to play again?")
    if comp =="Rock" and do == "rock":
        print(f"You chose {do} and the computer chose {comp}")
        print("You tied with the computer")
        play = input("would you like to play again?")
    if comp =="Rock" and do == "paper":
        print(f"You chose {do} and the computer chose {comp}")
        print("You beat the computer")
        play = input("would you like to play again?")
    if comp =="Rock" and do == "paper":
        print(f"You chose {do} and the computer chose {comp}")
        print("The computer won")
        play = input("would you like to play again?")
    if comp =="Paper" and do == "paper":
        print(f"You chose {do} and the computer chose {comp}")
        print("You tied with the computer")
        play = input("would you like to play again?")
    if comp =="Paper" and do == "rock":
        print(f"You chose {do} and the computer chose {comp}")
        print("The computer won")
        play = input("would you like to play again?")
    if comp =="Paper" and do == "scissors":
        print(f"You chose {do} and the computer chose {comp}")
        print("You beat the computer")
        play = input("would you like to play again?")
    
