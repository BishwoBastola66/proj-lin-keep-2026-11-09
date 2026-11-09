using System;

class SimpleCalculator
{
    public static void Run()
    {
        double num1, num2, result;
        int choice;

        Console.WriteLine("1. Adds");
        Console.WriteLine("2. Subts");
        Console.WriteLine("3. Multiply");
        Console.WriteLine("4. Divise");
        Console.WriteLine("5. remiand");

        Console.Write("\nEnter your choice: ");
        choice = Convert.ToInt32(Console.ReadLine());

        Console.Write("Enter first number: ");
        num1 = Convert.ToDouble(Console.ReadLine());

        Console.Write("Enter second number: ");
        num2 = Convert.ToDouble(Console.ReadLine());

        switch (choice)
        {
            case 1:
                result = num1 + num2;
                Console.WriteLine("Addition = " + result);
                break;

            case 2:
                result = num1 - num2;
                Console.WriteLine("Subtraction = " + result);
                break;

            case 3:
                result = num1 * num2;
                Console.WriteLine("Multiplication = " + result);
                break;

            case 4:
                if (num2 == 0)
                    Console.WriteLine("Cannot divide by zero!");
                else
                {
                    result = num1 / num2;
                    Console.WriteLine("Division = " + result);
                }
                break;

            case 5:
                if (num2 == 0)
                    Console.WriteLine("Cannot calculate modulus by zero!");
                else
                {
                    result = num1 % num2;
                    Console.WriteLine("Modulus = " + result);
                }
                break;

            default:
                Console.WriteLine("Invalid Choice!");
                break;
        }
    }
}