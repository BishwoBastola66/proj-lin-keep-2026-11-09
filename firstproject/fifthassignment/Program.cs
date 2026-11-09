using System;

class Program
{
    static void Main(string[] args)
    {
        int choice;

        do
        {

            Console.WriteLine("1. Student Grade");
            Console.WriteLine("2. ATM Withdrawal");
            Console.WriteLine("3. Electricity ");
            Console.WriteLine("4. Calculator");
            Console.WriteLine("5. Exit");

            Console.Write("\nEnter your choice: ");
            choice = Convert.ToInt32(Console.ReadLine());

            switch (choice)
            {
                case 1:
                    StudentGrade.Run();
                    break;

                case 2:
                    ATMWithdrawal.Run();
                    break;

                case 3:
                    ElectricityBill.Run();
                    break;

                case 4:
                    SimpleCalculator.Run();
                    break;

                case 5:
                    Console.WriteLine("Exited");
                    break;

                default:
                    Console.WriteLine("Invalid Choice! Please try again.");
                    break;
            }

        } while (choice != 5);
    }
}