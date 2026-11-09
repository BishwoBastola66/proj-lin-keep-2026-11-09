using System;

class Program
{
    static void Main(string[] args)
    {
        int choice = 0;

        do
        {
            Console.WriteLine("\n===== C# PROGRAM MENU =====");
            Console.WriteLine("1. Personal Information");
            Console.WriteLine("2. Calculate Total and Average");
            Console.WriteLine("3. Swap Two Numbers");
            Console.WriteLine("4. Calculate Simple Interest");
            Console.WriteLine("5. Exit");

            Console.Write("\nEnter your choice: ");

            choice = Convert.ToInt32(Console.ReadLine());

            switch (choice)
            {
                case 1:
                    PersonalInformation.Run();
                    break;

                case 2:
                    TotalAverage.Run();
                    break;

                case 3:
                    SwapNumbers.Run();
                    break;

                case 4:
                    SimpleInterest.Run();
                    break;

                case 5:
                    Console.WriteLine("Program Exited Successfully!");
                    break;

                default:
                    Console.WriteLine("Invalid Choice! Please try again.");
                    break;
            }

        } while (choice != 5);
    }
}
