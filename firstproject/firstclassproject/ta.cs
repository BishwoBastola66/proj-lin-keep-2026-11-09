using System;

class TotalAverage
{
    public static void Run()
    {
        double sub1, sub2, sub3;
        double total, average;

        Console.Write("marks of S1: ");
        sub1 = Convert.ToDouble(Console.ReadLine());

        Console.Write("marks of S2: ");
        sub2 = Convert.ToDouble(Console.ReadLine());

        Console.Write("marks of s3:");
        sub3 = Convert.ToDouble(Console.ReadLine());

        total = sub1 + sub2 + sub3;
        average = total / 3;

        Console.WriteLine("\nTotal Marks = " + total);
        Console.WriteLine("Average Marks = " + average);
    }
}
