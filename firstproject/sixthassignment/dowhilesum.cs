using System;

class DoWhileSum
{
    public static void Run()
    {
        int number;
        int sum = 0;

        do
        {
            Console.Write("Enter a number (0 to stop): ");
            number = Convert.ToInt32(Console.ReadLine());

            Console.WriteLine("Entered Number: " + number);

            if (number != 0)
            {
                sum = sum + number;
            }

        } while (number != 0);

        Console.WriteLine("Total Sum: " + sum);
    }
}