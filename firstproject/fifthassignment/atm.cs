using System;

class ATMWithdrawal
{
    public static void Run()
    {
        int accountNumber, pin;
        double balance, amount;

        int correctAccount = 12345;
        int correctPin = 1234;

        Console.Write("Enter Account Number: ");
        accountNumber = Convert.ToInt32(Console.ReadLine());

        if (accountNumber != correctAccount)
        {
            Console.WriteLine("Invalid Account Number!");
            return;
        }

        Console.Write("Enter PIN Number: ");
        pin = Convert.ToInt32(Console.ReadLine());

        if (pin != correctPin)
        {
            Console.WriteLine("Incorrect PIN!");
            return;
        }

        Console.Write("Enter Available Balance: ");
        balance = Convert.ToDouble(Console.ReadLine());

        Console.Write("Enter Withdrawal Amount: ");
        amount = Convert.ToDouble(Console.ReadLine());

        if (amount <= 0)
        {
            Console.WriteLine("Invalid Withdrawal Amount!");
        }
        else if (amount > balance)
        {
            Console.WriteLine("Insufficient Balance!");
        }
        else
        {
            balance = balance - amount;

            Console.WriteLine("\nWithdrawal Successful!");
            Console.WriteLine("Withdrawn Amount: " + amount);
            Console.WriteLine("Remaining Balance: " + balance);
        }
    }
}