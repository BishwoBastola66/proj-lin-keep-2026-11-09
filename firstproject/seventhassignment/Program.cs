using System;

class Program
{
    static void Main()
    {
        for (int i = 5; i >= 1; i--)
        {
            for (int b = 1; b <= i; b++)
            {
                Console.Write("*");
            }
            Console.WriteLine();
        }
    }
}