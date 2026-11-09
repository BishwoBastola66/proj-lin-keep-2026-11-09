using System;

class SwapNumbers
{
    public static void Run()
    {
        int a, b, temp;

        Console.Write("Enter first number: ");
        a = Convert.ToInt32(Console.ReadLine());

        Console.Write("Enter second number: ");
        b = Convert.ToInt32(Console.ReadLine());

        Console.WriteLine("\nBefore:");
        Console.WriteLine("a = " + a);
        Console.WriteLine("b = " + b);

        // Swapping using third variable
        temp = a;
        a = b;
        b = temp;

        Console.WriteLine("\nAfteR");
        Console.WriteLine("a = " + a);
        Console.WriteLine("b = " + b);
    }
}