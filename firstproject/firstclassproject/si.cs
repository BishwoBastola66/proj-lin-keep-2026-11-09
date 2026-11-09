using System;

class SimpleInterest
{
    public static void Run()
    {
        double principal, rate, time, SI;

        Console.Write("Principal Amount: ");
        principal = Convert.ToDouble(Console.ReadLine());

        Console.Write(" Rate of Interest: ");
        rate = Convert.ToDouble(Console.ReadLine());

        Console.Write("Time: ");
        time = Convert.ToDouble(Console.ReadLine());

        // Calculate Simple Interest
        SI = (principal * rate * time) / 100;

        Console.WriteLine("\nSimple Interest = " + SI);

    }
}