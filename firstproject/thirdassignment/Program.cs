
using System;

class Calcu
{
    static void Main()
    {
        int a, b;

        Console.Write("first number: ");
        a = Convert.ToInt32(Console.ReadLine());
        Console.Write("second number: ");
        b = Convert.ToInt32(Console.ReadLine());

        Console.WriteLine("Added = " + (a + b));   //add
        Console.WriteLine("Subsd = " + (a - b));//subsd
        Console.WriteLine("Multiplied = " + (a * b));  //multiply
        Console.WriteLine("Divided = " + (a / b));//divided
        Console.WriteLine("Remainder = " + (a % b));//remainder
    }
}
