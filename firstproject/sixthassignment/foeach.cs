using System;

class StudentNames
{
    public static void Run()
    {
        string[] names = { "Ram", "Shyam", "Hari", "Sita", "Gita" };

        int count = 0;

        Console.WriteLine("List of Student Names:");

        foreach (string name in names)
        {
            Console.WriteLine(name);
            count++;
        }

        Console.WriteLine("Total Number of Students: " + count);
    }
}