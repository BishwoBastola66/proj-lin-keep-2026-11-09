using System;

class StudentGrade
{
    public static void Run()
    {
        string name;
        int marks;

        Console.Write("student name: ");
        name = Console.ReadLine() ?? "";

        Console.Write("marks");
        marks = Convert.ToInt32(Console.ReadLine());

        if (marks < 0 || marks > 100)
        {
            Console.WriteLine("Invalid");
        }
        else
        {
            Console.WriteLine("Name: " + name);

            if (marks >= 90)
                Console.WriteLine("Grade: A+");
            else if (marks >= 80)
                Console.WriteLine("Grade: A");
            else if (marks >= 70)
                Console.WriteLine("Grade: B");
            else if (marks >= 60)
                Console.WriteLine("Grade: C");
            else if (marks >= 40)
                Console.WriteLine("Grade: D");
            else
                Console.WriteLine("Fail");

            if (marks >= 40)
                Console.WriteLine("Passed.");
        }
    }
}